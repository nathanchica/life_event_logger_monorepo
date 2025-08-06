import { PrismaClient, Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { Resolvers } from '../../generated/graphql.js';
import { getIdEncoder } from '../../utils/encoder.js';
import { formatZodError } from '../../utils/validation.js';
import { EventLabelParent } from '../eventLabel/index.js';
import { UserParent } from '../user/index.js';

export const MAX_EVENT_NAME_LENGTH = 25;

export type LoggableEventParent = {
    id?: string;
    name?: string;
    timestamps?: Array<Date>;
    warningThresholdInDays?: number;
    user?: UserParent;
    createdAt?: Date;
    updatedAt?: Date;
    labels?: Array<EventLabelParent>;
};

const CreateLoggableEventSchema = z.object({
    name: z
        .string()
        .min(1, 'Name cannot be empty')
        .max(MAX_EVENT_NAME_LENGTH, `Name must be under ${MAX_EVENT_NAME_LENGTH} characters`),
    warningThresholdInDays: z.number().int().min(0, 'Warning threshold must be a positive number'),
    labelIds: z.array(z.string()).optional()
});

const UpdateLoggableEventSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z
        .string()
        .min(1, 'Name cannot be empty')
        .max(MAX_EVENT_NAME_LENGTH, `Name must be under ${MAX_EVENT_NAME_LENGTH} characters`)
        .optional(),
    warningThresholdInDays: z.number().int().min(0, 'Warning threshold must be a positive number').optional(),
    timestamps: z.array(z.date()).optional(),
    labelIds: z.array(z.string()).optional()
});

type UpdateLoggableEventInput = z.infer<typeof UpdateLoggableEventSchema>;

/**
 * Processes an array of timestamps by removing duplicates and sorting newest first
 * @param timestamps - Array of Date objects to process
 * @returns Deduplicated and sorted array of Date objects (newest first)
 */
const processTimestamps = (timestamps: Date[]): Date[] => {
    const uniqueTimestamps = Array.from(new Set(timestamps.map((timestamp) => new Date(timestamp).getTime()))).map(
        (time) => new Date(time)
    );

    return uniqueTimestamps.sort(
        (timestampA, timestampB) => new Date(timestampB).getTime() - new Date(timestampA).getTime()
    );
};

/**
 * Validates that the event name is unique for the user
 * @returns Validation error if name already exists, null otherwise
 */
const validateEventNameUniqueness = async ({
    name,
    userId,
    prisma,
    excludeEventId
}: {
    name: string;
    userId: string;
    prisma: PrismaClient;
    excludeEventId?: string;
}) => {
    const whereClause = {
        name,
        userId,
        ...(excludeEventId ? { NOT: { id: excludeEventId } } : {})
    };

    const existingEvent = await prisma.loggableEvent.findFirst({
        where: whereClause
    });

    if (existingEvent) {
        return {
            code: 'VALIDATION_ERROR',
            field: 'name',
            message: 'An event with this name already exists'
        };
    }

    return null;
};

/**
 * Validates that all provided labelIds exist and belong to the user
 * @throws {GraphQLError} When some labels don't exist or don't belong to the user
 */
const validateLabelOwnership = async ({
    labelIds,
    userId,
    prisma
}: {
    labelIds: string[];
    userId: string;
    prisma: PrismaClient;
}): Promise<void> => {
    const labels = await prisma.eventLabel.findMany({
        where: {
            id: { in: labelIds },
            userId: userId
        },
        select: { id: true }
    });

    if (labels.length !== labelIds.length) {
        throw new GraphQLError('Some labels do not exist or do not belong to you', {
            extensions: { code: 'FORBIDDEN' }
        });
    }
};

/**
 * Builds object from processed input to be used for updateLoggableEventHelper
 */
export const buildPrismaUpdateData = (processedInput: UpdateLoggableEventInput): Prisma.LoggableEventUpdateInput => {
    const { name, warningThresholdInDays, timestamps, labelIds } = processedInput;

    return {
        ...(name ? { name } : {}),
        ...(warningThresholdInDays !== undefined ? { warningThresholdInDays } : {}),
        ...(timestamps !== undefined ? { timestamps: { set: processTimestamps(timestamps) } } : {}),
        ...(labelIds !== undefined
            ? {
                  labels: {
                      set: labelIds.map((id) => ({ id }))
                  }
              }
            : {})
    };
};

/**
 * Processes user input for updating a loggable event by validating input and decoding IDs
 */
export const processUpdateLoggableEventInput = (input: UpdateLoggableEventInput): UpdateLoggableEventInput => {
    let processedInput: UpdateLoggableEventInput = { ...input };

    const encoder = getIdEncoder();
    const decodedEventId = encoder.decode(input.id, 'loggableEvent');
    processedInput.id = decodedEventId;

    if (input.labelIds && input.labelIds.length > 0) {
        const decodedLabelIds = encoder.decodeBatch(input.labelIds, 'eventLabel');
        processedInput.labelIds = decodedLabelIds;
    }

    return processedInput;
};

const resolvers: Resolvers = {
    Mutation: {
        createLoggableEvent: async (_, { input }, { user, prisma }) => {
            // Auth check handled by @requireAuth directive
            try {
                const validatedInput = CreateLoggableEventSchema.parse(input);

                invariant(user, 'User should exist after @requireAuth directive validation');

                // Check if name already exists for this user
                const nameValidationError = await validateEventNameUniqueness({
                    name: validatedInput.name,
                    userId: user.id,
                    prisma
                });

                if (nameValidationError) {
                    return {
                        tempID: input.id,
                        loggableEvent: null,
                        errors: [nameValidationError]
                    };
                }

                // Decode and validate labelIds ownership if provided
                let decodedLabelIds: string[] | undefined;
                if (validatedInput.labelIds && validatedInput.labelIds.length > 0) {
                    const encoder = getIdEncoder();
                    decodedLabelIds = encoder.decodeBatch(validatedInput.labelIds, 'eventLabel');

                    await validateLabelOwnership({
                        labelIds: decodedLabelIds,
                        userId: user.id,
                        prisma
                    });
                }

                const event = await prisma.loggableEvent.create({
                    data: {
                        name: validatedInput.name,
                        warningThresholdInDays: validatedInput.warningThresholdInDays,
                        userId: user.id,
                        timestamps: [],
                        labels: decodedLabelIds
                            ? {
                                  connect: decodedLabelIds.map((id) => ({ id }))
                              }
                            : undefined
                    },
                    include: { labels: true }
                });

                return {
                    tempID: input.id, // Return the temporary ID
                    loggableEvent: event,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        tempID: null,
                        loggableEvent: null,
                        errors: formatZodError(error)
                    };
                }

                if (error instanceof GraphQLError) {
                    // Re-throw GraphQL errors (like authorization failures)
                    throw error;
                }

                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in createLoggableEvent:', error);
                throw new Error('Internal server error');
            }
        },

        updateLoggableEvent: async (_, { input }, { user, prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = UpdateLoggableEventSchema.parse(input);

                invariant(user, 'User should exist after @requireOwner directive validation');

                const processedInput = processUpdateLoggableEventInput(validatedInput);

                // Check if name already exists for this user (excluding current event)
                if (processedInput.name) {
                    const nameValidationError = await validateEventNameUniqueness({
                        name: processedInput.name,
                        userId: user.id,
                        prisma,
                        excludeEventId: processedInput.id
                    });

                    if (nameValidationError) {
                        return {
                            loggableEvent: null,
                            errors: [nameValidationError]
                        };
                    }
                }

                // Validate labelIds ownership if provided
                if (processedInput.labelIds && processedInput.labelIds.length > 0) {
                    await validateLabelOwnership({
                        labelIds: processedInput.labelIds,
                        userId: user.id,
                        prisma
                    });
                }

                const event = await prisma.loggableEvent.update({
                    where: { id: processedInput.id },
                    data: buildPrismaUpdateData(processedInput),
                    include: { labels: true }
                });

                return {
                    loggableEvent: event,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        loggableEvent: null,
                        errors: formatZodError(error)
                    };
                }

                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in updateLoggableEvent:', error);
                throw new Error('Internal server error');
            }
        },

        deleteLoggableEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                // Decode the event ID
                const encoder = getIdEncoder();
                const decodedEventId = encoder.decode(input.id, 'loggableEvent');

                // @requireOwner directive already validated the event exists and user owns it
                const event = await prisma.loggableEvent.delete({
                    where: { id: decodedEventId },
                    include: { labels: true }
                });

                return {
                    loggableEvent: event,
                    errors: []
                };
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in deleteLoggableEvent:', error);
                throw new Error('Internal server error');
            }
        },

        addTimestampToEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                // Decode the event ID
                const encoder = getIdEncoder();
                const decodedEventId = encoder.decode(input.id, 'loggableEvent');

                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: decodedEventId },
                    select: { timestamps: true }
                });

                invariant(currentEvent, 'Event should exist after auth directive validation');

                const event = await prisma.loggableEvent.update({
                    where: { id: decodedEventId },
                    data: buildPrismaUpdateData({
                        id: decodedEventId,
                        timestamps: [...currentEvent.timestamps, new Date(input.timestamp)]
                    }),
                    include: { labels: true }
                });

                return {
                    loggableEvent: event,
                    errors: []
                };
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in addTimestampToEvent:', error);
                throw new Error('Internal server error');
            }
        },

        removeTimestampFromEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                // Decode the event ID
                const encoder = getIdEncoder();
                const decodedEventId = encoder.decode(input.id, 'loggableEvent');

                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: decodedEventId },
                    select: { timestamps: true }
                });

                invariant(currentEvent, 'Event should exist after auth directive validation');

                // Check if the timestamp exists before removing
                const timestampToRemove = new Date(input.timestamp).getTime();
                const timestampExists = currentEvent.timestamps.some(
                    (timestamp: Date) => timestamp.getTime() === timestampToRemove
                );

                if (!timestampExists) {
                    return {
                        loggableEvent: null,
                        errors: [{ code: 'NOT_FOUND', field: 'timestamp', message: 'Timestamp not found' }]
                    };
                }

                // Remove the timestamp from existing ones
                const updatedTimestamps = currentEvent.timestamps.filter(
                    (timestamp: Date) => timestamp.getTime() !== timestampToRemove
                );

                const event = await prisma.loggableEvent.update({
                    where: { id: decodedEventId },
                    data: buildPrismaUpdateData({
                        id: decodedEventId,
                        timestamps: updatedTimestamps
                    }),
                    include: { labels: true }
                });

                return {
                    loggableEvent: event,
                    errors: []
                };
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in removeTimestampFromEvent:', error);
                throw new Error('Internal server error');
            }
        }
    },

    LoggableEvent: {
        id: (parent) => {
            const encoder = getIdEncoder();
            return encoder.encode(parent.id, 'loggableEvent');
        },
        user: async (parent, _, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { id: parent.userId }
            });
            if (!user) {
                throw new GraphQLError(`User not found for LoggableEvent ${parent.id}`, {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return user;
        },
        labels: async (parent, _, { prisma }) => {
            return prisma.eventLabel.findMany({
                where: {
                    loggableEvents: {
                        some: { id: parent.id }
                    }
                }
            });
        }
    }
};

export default resolvers;
