import { z } from 'zod';

import { GraphQLContext } from '../../context';
import { Resolvers } from '../../generated/graphql';
import { formatZodError } from '../../utils/validation';
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

const resolvers: Resolvers<GraphQLContext> = {
    Mutation: {
        // Authentication is handled by @requireAuth directive
        createEventLabel: async (_, { input }, { user, prisma }) => {
            try {
                const validatedInput = CreateEventLabelSchema.parse(input);

                const label = await prisma.eventLabel.create({
                    data: {
                        name: validatedInput.name,
                        // @requireAuth directive ensures user is authenticated
                        userId: user!.id
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

        // Authentication and ownership are handled by @requireOwner directive
        updateEventLabel: async (_, { input }, { prisma }) => {
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

        // Authentication and ownership are handled by @requireOwner directive
        deleteEventLabel: async (_, { input }, { prisma }) => {
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
