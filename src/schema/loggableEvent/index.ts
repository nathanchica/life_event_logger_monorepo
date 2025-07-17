import { PrismaClient, Prisma } from '@prisma/client';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { Resolvers } from '../../generated/graphql.js';
import { formatZodError } from '../../utils/validation.js';
import { UserParent } from '../user/index.js';

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
    name: z.string().min(1, 'Name cannot be empty').max(25, 'Name must be under 25 characters'),
    warningThresholdInDays: z.number().int().min(0, 'Warning threshold must be a positive number'),
    labelIds: z.array(z.string()).optional()
});

const UpdateLoggableEventSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name cannot be empty').max(25, 'Name must be under 25 characters').optional(),
    warningThresholdInDays: z.number().int().min(0, 'Warning threshold must be a positive number').optional(),
    timestamps: z.array(z.date()).optional()
});

const DeleteLoggableEventSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

const AddTimestampToEventSchema = z.object({
    id: z.string().min(1, 'Event ID is required'),
    timestamp: z.date()
});

const RemoveTimestampFromEventSchema = z.object({
    id: z.string().min(1, 'Event ID is required'),
    timestamp: z.date()
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

const updateLoggableEventHelper = async (
    eventId: string,
    updateData: Prisma.LoggableEventUpdateInput,
    prisma: PrismaClient
) => {
    try {
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
    } catch {
        return {
            loggableEvent: null,
            errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
        };
    }
};

const resolvers: Resolvers = {
    Mutation: {
        createLoggableEvent: async (_, { input }, { user, prisma }) => {
            // Auth check handled by @requireAuth directive
            try {
                const validatedInput = CreateLoggableEventSchema.parse(input);

                const event = await prisma.loggableEvent.create({
                    data: {
                        name: validatedInput.name,
                        warningThresholdInDays: validatedInput.warningThresholdInDays,
                        // @requireAuth directive ensures user is authenticated
                        userId: user!.id,
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

                return {
                    tempID: null,
                    loggableEvent: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        updateLoggableEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = UpdateLoggableEventSchema.parse(input);

                const updateData = {
                    ...(validatedInput.name ? { name: validatedInput.name } : {}),
                    ...(validatedInput.warningThresholdInDays !== undefined
                        ? { warningThresholdInDays: validatedInput.warningThresholdInDays }
                        : {}),
                    ...(validatedInput.timestamps !== undefined ? { timestamps: validatedInput.timestamps } : {})
                };

                return await updateLoggableEventHelper(validatedInput.id, updateData, prisma);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        loggableEvent: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    loggableEvent: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        deleteLoggableEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = DeleteLoggableEventSchema.parse(input);

                const event = await prisma.loggableEvent.delete({
                    where: { id: validatedInput.id },
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

                return {
                    loggableEvent: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        addTimestampToEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = AddTimestampToEventSchema.parse(input);

                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: validatedInput.id },
                    select: { timestamps: true }
                });

                invariant(currentEvent, 'Event should exist after auth directive validation');

                // Add the new timestamp to existing ones
                const updatedTimestamps = [...currentEvent.timestamps, validatedInput.timestamp];

                return await updateLoggableEventHelper(validatedInput.id, { timestamps: updatedTimestamps }, prisma);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        loggableEvent: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    loggableEvent: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        removeTimestampFromEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = RemoveTimestampFromEventSchema.parse(input);

                // Get the current event to retrieve existing timestamps
                // Auth directive already validated the event exists and user owns it
                const currentEvent = await prisma.loggableEvent.findUnique({
                    where: { id: validatedInput.id },
                    select: { timestamps: true }
                });

                invariant(currentEvent, 'Event should exist after auth directive validation');

                // Check if the timestamp exists before removing
                const timestampToRemove = validatedInput.timestamp.getTime();
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

                return await updateLoggableEventHelper(validatedInput.id, { timestamps: updatedTimestamps }, prisma);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        loggableEvent: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    loggableEvent: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        }
    },

    LoggableEvent: {
        user: async (parent, _, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { id: parent.userId }
            });
            if (!user) {
                throw new Error(`User not found for LoggableEvent ${parent.id}`);
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
