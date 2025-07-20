import { GraphQLError } from 'graphql';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { GraphQLContext } from '../../context.js';
import { Resolvers } from '../../generated/graphql.js';
import { formatZodError } from '../../utils/validation.js';
import { UserParent } from '../user/index.js';

export const MAX_EVENT_LABEL_NAME_LENGTH = 25;

export type EventLabelParent = {
    id?: string;
    name?: string;
    user?: UserParent;
    createdAt?: Date;
    updatedAt?: Date;
};

const CreateEventLabelSchema = z.object({
    name: z
        .string()
        .min(1, 'Name cannot be empty')
        .max(MAX_EVENT_LABEL_NAME_LENGTH, `Name must be under ${MAX_EVENT_LABEL_NAME_LENGTH} characters`)
});

const UpdateEventLabelSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z
        .string()
        .min(1, 'Name cannot be empty')
        .max(MAX_EVENT_LABEL_NAME_LENGTH, `Name must be under ${MAX_EVENT_LABEL_NAME_LENGTH} characters`)
        .optional()
});

const resolvers: Resolvers<GraphQLContext> = {
    Mutation: {
        // Authentication is handled by @requireAuth directive
        createEventLabel: async (_, { input }, { user, prisma }) => {
            try {
                const validatedInput = CreateEventLabelSchema.parse(input);

                // @requireAuth directive ensures user is authenticated
                invariant(user, 'User should be authenticated after auth directive validation');

                // Check if name already exists for this user
                const existingLabel = await prisma.eventLabel.findFirst({
                    where: {
                        name: validatedInput.name,
                        userId: user.id
                    }
                });

                if (existingLabel) {
                    return {
                        tempID: input.id,
                        eventLabel: null,
                        errors: [
                            {
                                code: 'VALIDATION_ERROR',
                                field: 'name',
                                message: 'A label with this name already exists'
                            }
                        ]
                    };
                }

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

                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in createEventLabel:', error);
                throw new Error('Internal server error');
            }
        },

        // Authentication and ownership are handled by @requireOwner directive
        updateEventLabel: async (_, { input }, { user, prisma }) => {
            try {
                const validatedInput = UpdateEventLabelSchema.parse(input);

                invariant(user, 'User should exist after @requireOwner directive validation');

                // Check if name already exists for this user (excluding current label)
                if (validatedInput.name) {
                    const existingLabel = await prisma.eventLabel.findFirst({
                        where: {
                            name: validatedInput.name,
                            userId: user.id,
                            NOT: { id: validatedInput.id }
                        }
                    });

                    if (existingLabel) {
                        return {
                            eventLabel: null,
                            errors: [
                                {
                                    code: 'VALIDATION_ERROR',
                                    field: 'name',
                                    message: 'A label with this name already exists'
                                }
                            ]
                        };
                    }
                }

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

                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in updateEventLabel:', error);
                throw new Error('Internal server error');
            }
        },

        // Authentication and ownership are handled by @requireOwner directive
        deleteEventLabel: async (_, { input }, { prisma }) => {
            try {
                // @requireOwner directive already validated the label exists and user owns it
                const label = await prisma.eventLabel.delete({
                    where: { id: input.id }
                });

                return {
                    eventLabel: label,
                    errors: []
                };
            } catch (error) {
                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in deleteEventLabel:', error);
                throw new Error('Internal server error');
            }
        }
    },

    EventLabel: {
        user: async (parent, _, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { id: parent.userId }
            });
            if (!user) {
                throw new GraphQLError(`User not found for EventLabel ${parent.id}`, {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return user;
        }
    }
};

export default resolvers;
