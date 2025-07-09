import { z } from 'zod';

import { GraphQLContext } from '../../context';
import { Resolvers } from '../../generated/graphql';
import { UserParent } from '../user';

export type EventLabelParent = {
    id?: string;
    name?: string;
    user?: UserParent;
    createdAt?: Date;
    updatedAt?: Date;
};

const CreateEventLabelSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty').max(25, 'Name must be under 25 characters')
});

const UpdateEventLabelSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name cannot be empty').max(25, 'Name must be under 25 characters').optional()
});

const DeleteEventLabelSchema = z.object({
    id: z.string().min(1, 'ID is required')
});

function formatZodError(error: z.ZodError) {
    return error.errors.map((err) => ({
        code: 'VALIDATION_ERROR',
        field: err.path.join('.'),
        message: err.message
    }));
}

const resolvers: Resolvers<GraphQLContext> = {
    Mutation: {
        createEventLabel: async (_, { input }, { user, prisma }) => {
            if (!user) {
                return {
                    eventLabel: null,
                    errors: [{ code: 'UNAUTHORIZED', field: null, message: 'Not authenticated' }]
                };
            }

            try {
                const validatedInput = CreateEventLabelSchema.parse(input);

                const label = await prisma.eventLabel.create({
                    data: {
                        name: validatedInput.name,
                        userId: user.id
                    }
                });

                return {
                    eventLabel: label,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        eventLabel: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    eventLabel: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        updateEventLabel: async (_, { input }, { user, prisma }) => {
            if (!user) {
                return {
                    eventLabel: null,
                    errors: [{ code: 'UNAUTHORIZED', field: null, message: 'Not authenticated' }]
                };
            }

            try {
                const validatedInput = UpdateEventLabelSchema.parse(input);

                const existingLabel = await prisma.eventLabel.findUnique({
                    where: { id: validatedInput.id }
                });

                if (!existingLabel) {
                    return {
                        eventLabel: null,
                        errors: [{ code: 'NOT_FOUND', field: 'id', message: 'Event label not found' }]
                    };
                }

                if (existingLabel.userId !== user.id) {
                    return {
                        eventLabel: null,
                        errors: [
                            {
                                code: 'FORBIDDEN',
                                field: null,
                                message: 'You do not have permission to update this event label'
                            }
                        ]
                    };
                }

                const updateData: { name?: string } = {};
                if (validatedInput.name) {
                    updateData.name = validatedInput.name;
                }

                const label = await prisma.eventLabel.update({
                    where: { id: validatedInput.id },
                    data: updateData
                });

                return {
                    eventLabel: label,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        eventLabel: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    eventLabel: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        deleteEventLabel: async (_, { input }, { user, prisma }) => {
            if (!user) {
                return {
                    eventLabel: null,
                    errors: [{ code: 'UNAUTHORIZED', field: null, message: 'Not authenticated' }]
                };
            }

            try {
                const validatedInput = DeleteEventLabelSchema.parse(input);

                const existingLabel = await prisma.eventLabel.findUnique({
                    where: { id: validatedInput.id }
                });

                if (!existingLabel) {
                    return {
                        eventLabel: null,
                        errors: [{ code: 'NOT_FOUND', field: 'id', message: 'Event label not found' }]
                    };
                }

                if (existingLabel.userId !== user.id) {
                    return {
                        eventLabel: null,
                        errors: [
                            {
                                code: 'FORBIDDEN',
                                field: null,
                                message: 'You do not have permission to delete this event label'
                            }
                        ]
                    };
                }

                const label = await prisma.eventLabel.delete({
                    where: { id: validatedInput.id }
                });

                return {
                    eventLabel: label,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        eventLabel: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    eventLabel: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        }
    },

    EventLabel: {
        user: async (parent, _, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { id: parent.userId }
            });
            if (!user) {
                throw new Error(`User not found for EventLabel ${parent.id}`);
            }
            return user;
        }
    }
};

export default resolvers;
