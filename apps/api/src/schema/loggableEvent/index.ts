import { PrismaClient, Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { Resolvers } from '../../generated/graphql.js';
import { formatZodError } from '../../utils/validation.js';
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

const updateLoggableEventHelper = async ({
    eventId,
    updateData,
    prisma
}: {
    eventId: string;
    updateData: Prisma.LoggableEventUpdateInput;
    prisma: PrismaClient;
}) => {
    // Process timestamps if they are being updated
    if (updateData.timestamps && Array.isArray(updateData.timestamps)) {
        updateData.timestamps = { set: processTimestamps(updateData.timestamps as Date[]) };
    }

    const event = await prisma.loggableEvent.update({
        where: { id: eventId },
        data: updateData,
        include: { labels: true }
    });

    return {
        loggableEvent: event,
        errors: []
    };
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

                // Validate labelIds ownership if provided
                if (validatedInput.labelIds && validatedInput.labelIds.length > 0) {
                    await validateLabelOwnership({
                        labelIds: validatedInput.labelIds,
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
                        labels: validatedInput.labelIds
                            ? {
                                  connect: validatedInput.labelIds.map((id) => ({ id }))
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

                // Check if name already exists for this user (excluding current event)
                if (validatedInput.name) {
                    const nameValidationError = await validateEventNameUniqueness({
                        name: validatedInput.name,
                        userId: user.id,
                        prisma,
                        excludeEventId: validatedInput.id
                    });

                    if (nameValidationError) {
                        return {
                            loggableEvent: null,
                            errors: [nameValidationError]
                        };
                    }
                }

                // Validate labelIds ownership if provided
                if (validatedInput.labelIds && validatedInput.labelIds.length > 0) {
                    await validateLabelOwnership({
                        labelIds: validatedInput.labelIds,
                        userId: user.id,
                        prisma
                    });
                }

                const updateData = {
                    ...(validatedInput.name ? { name: validatedInput.name } : {}),
                    ...(validatedInput.warningThresholdInDays !== undefined
                        ? { warningThresholdInDays: validatedInput.warningThresholdInDays }
                        : {}),
                    ...(validatedInput.timestamps !== undefined ? { timestamps: validatedInput.timestamps } : {}),
                    ...(validatedInput.labelIds !== undefined
                        ? {
                              labels: {
                                  set: validatedInput.labelIds.map((id) => ({ id }))
                              }
                          }
                        : {})
                };

                return await updateLoggableEventHelper({
                    eventId: validatedInput.id,
                    updateData,
                    prisma
                });
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
                // @requireOwner directive already validated the event exists and user owns it
                const event = await prisma.loggableEvent.delete({
                    where: { id: input.id },
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
                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: input.id },
                    select: { timestamps: true }
                });

                invariant(currentEvent, 'Event should exist after auth directive validation');

                // Add the new timestamp to existing ones
                const updatedTimestamps = [...currentEvent.timestamps, new Date(input.timestamp)];

                return await updateLoggableEventHelper({
                    eventId: input.id,
                    updateData: { timestamps: updatedTimestamps },
                    prisma
                });
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in addTimestampToEvent:', error);
                throw new Error('Internal server error');
            }
        },

        removeTimestampFromEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: input.id },
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

                return await updateLoggableEventHelper({
                    eventId: input.id,
                    updateData: { timestamps: updatedTimestamps },
                    prisma
                });
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in removeTimestampFromEvent:', error);
                throw new Error('Internal server error');
            }
        }
    },

    LoggableEvent: {
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
