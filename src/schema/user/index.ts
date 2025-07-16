import { z } from 'zod';

import { generateJWT, verifyGoogleToken } from '../../auth/token.js';
import { Resolvers } from '../../generated/graphql.js';
import { formatZodError } from '../../utils/validation.js';
import { EventLabelParent } from '../eventLabel/index.js';
import { LoggableEventParent } from '../loggableEvent/index.js';

export type UserParent = {
    id: string;
    googleId: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    loggableEvents: Array<LoggableEventParent>;
    eventLabels: Array<EventLabelParent>;
};

const GoogleOAuthLoginMutationSchema = z.object({
    googleToken: z.string().min(1, 'Google token is required')
});

const resolvers: Resolvers = {
    Query: {
        loggedInUser: async (_, __, { user }) => {
            return user;
        }
    },

    Mutation: {
        googleOAuthLoginMutation: async (_, { input }, { prisma }) => {
            try {
                const validatedInput = GoogleOAuthLoginMutationSchema.parse(input);

                const googleUser = await verifyGoogleToken(validatedInput.googleToken);
                if (!googleUser || !googleUser.sub || !googleUser.email || !googleUser.name) {
                    return {
                        token: null,
                        user: null,
                        errors: [{ code: 'INVALID_TOKEN', field: 'googleToken', message: 'Invalid Google token' }]
                    };
                }

                let user = await prisma.user.findUnique({
                    where: { googleId: googleUser.sub }
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            googleId: googleUser.sub,
                            email: googleUser.email,
                            name: googleUser.name
                        }
                    });
                }

                const token = generateJWT({ userId: user.id, email: user.email });

                return {
                    token,
                    user,
                    errors: []
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        token: null,
                        user: null,
                        errors: formatZodError(error)
                    };
                }

                return {
                    token: null,
                    user: null,
                    errors: [{ code: 'INTERNAL_ERROR', field: null, message: 'Something went wrong' }]
                };
            }
        }
    },

    User: {
        loggableEvents: async (parent, _, { prisma }) => {
            return prisma.loggableEvent.findMany({
                where: { userId: parent.id },
                include: { labels: true }
            });
        },
        eventLabels: async (parent, _, { prisma }) => {
            return prisma.eventLabel.findMany({
                where: { userId: parent.id }
            });
        }
    }
};

export default resolvers;
