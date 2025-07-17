import invariant from 'tiny-invariant';
import { z } from 'zod';

import { GraphQLContext } from '../../context.js';
import { Resolvers } from '../../generated/graphql.js';
import { formatZodError } from '../../utils/validation.js';
import { UserParent } from '../user/index.js';

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

                // @requireAuth directive ensures user is authenticated
                invariant(user, 'User should be authenticated after auth directive validation');

                const label = await prisma.eventLabel.create({
                    data: {
                        name: validatedInput.name,
                        userId: user.id
                    }
                });

                return {
                    tempID: input.id, // Return the temporary ID
                    eventLabel: label,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        tempID: null,
                        eventLabel: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    tempID: null,
                    eventLabel: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        },

        // Authentication and ownership are handled by @requireOwner directive
        updateEventLabel: async (_, { input }, { prisma }) => {
            try {
                const validatedInput = UpdateEventLabelSchema.parse(input);

                // @requireOwner directive already validated the label exists and user owns it
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

                // @requireOwner directive already validated the label exists and user owns it
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
