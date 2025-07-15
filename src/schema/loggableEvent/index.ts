import { z } from 'zod';

import { Resolvers } from '../../generated/graphql';
import { formatZodError } from '../../utils/validation';
import { UserParent } from '../user';

export type LoggableEventParent = {
    id?: string;
    name?: string;
    dateTimeRecords?: Array<Date>;
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
    dateTimeRecords: z.array(z.date()).optional()
});

const DeleteLoggableEventSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

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
                        dateTimeRecords: [],
                        labels: validatedInput.labelIds
                            ? {
                                  connect: validatedInput.labelIds.map((id) => ({ id }))
                              }
                            : undefined
                    },
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

        updateLoggableEvent: async (_, { input }, { prisma }) => {
            // Auth and ownership checks handled by @requireOwner directive
            try {
                const validatedInput = UpdateLoggableEventSchema.parse(input);

                const event = await prisma.loggableEvent.update({
                    where: { id: validatedInput.id },
                    data: {
                        ...(validatedInput.name ? { name: validatedInput.name } : {}),
                        ...(validatedInput.warningThresholdInDays !== undefined
                            ? { warningThresholdInDays: validatedInput.warningThresholdInDays }
                            : {}),
                        ...(validatedInput.dateTimeRecords !== undefined
                            ? { dateTimeRecords: validatedInput.dateTimeRecords }
                            : {})
                    },
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
