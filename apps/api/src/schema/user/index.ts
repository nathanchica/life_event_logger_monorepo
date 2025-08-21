import { serialize } from 'cookie';
import { GraphQLError } from 'graphql';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import {
    createRefreshToken,
    generateAccessToken,
    revokeAllUserTokens,
    revokeRefreshToken,
    rotateRefreshToken,
    validateRefreshToken,
    verifyGoogleToken,
    MILLISECONDS_IN_DAY
} from '../../auth/token.js';
import { env } from '../../config/env.js';
import { ClientType, Resolvers } from '../../generated/graphql.js';
import { getIdEncoder } from '../../utils/encoder.js';
import { isGraphQLError } from '../../utils/error.js';
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
    googleToken: z.string().min(1, 'Google token is required'),
    clientType: z.nativeEnum(ClientType).optional().default(ClientType.Web)
});

// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN_DAYS * MILLISECONDS_IN_DAY,
    path: '/',
    // In development, omit sameSite to allow cross-origin cookies
    // In production, use 'lax' for security
    /* v8 ignore start */
    ...(env.NODE_ENV === 'production' ? { sameSite: 'lax' as const } : {})
    /* v8 ignore stop */
};

const resolvers: Resolvers = {
    Query: {
        loggedInUser: async (_, __, { user }) => {
            return user;
        }
    },

    Mutation: {
        googleOAuthLoginMutation: async (_, { input }, { prisma, requestMetadata, response }) => {
            try {
                const { googleToken, clientType } = GoogleOAuthLoginMutationSchema.parse(input);

                const googleUser = await verifyGoogleToken(googleToken);

                if (!googleUser || !googleUser.sub || !googleUser.email || !googleUser.name) {
                    return {
                        token: null,
                        accessToken: null,
                        refreshToken: null,
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

                // Generate tokens
                const accessToken = generateAccessToken({ userId: user.id, email: user.email });

                // Create refresh token
                const refreshToken = await createRefreshToken(prisma, user.id, requestMetadata);

                // Set refresh token as httpOnly cookie for web clients
                if (clientType === ClientType.Web) {
                    response.headers.set('Set-Cookie', serialize('refreshToken', refreshToken, COOKIE_OPTIONS));

                    return {
                        token: accessToken,
                        accessToken,
                        refreshToken: undefined,
                        user,
                        errors: []
                    };
                } else {
                    // Return refresh token in response for mobile clients
                    return {
                        token: accessToken,
                        accessToken,
                        refreshToken,
                        user,
                        errors: []
                    };
                }
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        token: null,
                        accessToken: null,
                        refreshToken: null,
                        user: null,
                        errors: formatZodError(error)
                    };
                }

                // Log the actual error for debugging (will appear in Vercel logs)
                console.error('Error in googleOAuthLoginMutation:', error);
                throw new Error('Internal server error');
            }
        },

        refreshTokenMutation: async (_, { input }, { prisma, requestMetadata, response, cookies }) => {
            try {
                let token: string | null = null;

                // Try cookie first (web clients)
                if (cookies?.refreshToken) {
                    token = cookies.refreshToken;
                }
                // Fall back to input
                else if (input?.refreshToken) {
                    token = input.refreshToken;
                }

                if (!token) {
                    throw new GraphQLError('No refresh token provided', {
                        extensions: { code: 'UNAUTHENTICATED' }
                    });
                }

                // Validate refresh token
                const tokenData = await validateRefreshToken(prisma, token);
                if (!tokenData) {
                    throw new GraphQLError('Invalid or expired refresh token', {
                        extensions: { code: 'UNAUTHENTICATED' }
                    });
                }

                const { userId, tokenId } = tokenData;

                // Get user
                const user = await prisma.user.findUnique({
                    where: { id: userId }
                });

                if (!user) {
                    throw new GraphQLError('User not found', {
                        extensions: { code: 'NOT_FOUND' }
                    });
                }

                // Generate new access token
                const accessToken = generateAccessToken({ userId: user.id, email: user.email });

                // Rotate refresh token
                const newRefreshToken = await rotateRefreshToken(prisma, tokenId, requestMetadata);

                // Determine client type based on how token was provided
                const isWebClient = !!cookies?.refreshToken;

                if (isWebClient) {
                    response.headers.set('Set-Cookie', serialize('refreshToken', newRefreshToken, COOKIE_OPTIONS));
                    return {
                        accessToken,
                        refreshToken: undefined,
                        errors: []
                    };
                } else {
                    return {
                        accessToken,
                        refreshToken: newRefreshToken,
                        errors: []
                    };
                }
            } catch (error) {
                if (isGraphQLError(error)) {
                    throw error;
                }
                console.error('Error in refreshTokenMutation:', error);
                throw new Error('Internal server error');
            }
        },

        logoutMutation: async (_, { input }, { prisma, cookies, response }) => {
            try {
                let token: string | null = null;

                // Try cookie first (web clients)
                if (cookies?.refreshToken) {
                    token = cookies.refreshToken;
                }
                // Fall back to input (mobile clients)
                else if (input?.refreshToken) {
                    token = input.refreshToken;
                }

                if (!token) {
                    // If no token provided, consider it a successful logout
                    return {
                        success: true,
                        errors: []
                    };
                }

                // Revoke the refresh token
                await revokeRefreshToken(prisma, token);

                // Clear cookie for web clients
                if (cookies?.refreshToken) {
                    response.headers.set(
                        'Set-Cookie',
                        serialize('refreshToken', '', {
                            ...COOKIE_OPTIONS,
                            maxAge: 0 // Expire immediately
                        })
                    );
                }

                return {
                    success: true,
                    errors: []
                };
            } catch (error) {
                console.error('Error in logoutMutation:', error);
                return {
                    success: false,
                    errors: [{ code: 'INTERNAL_ERROR', message: 'Failed to logout' }]
                };
            }
        },

        logoutAllDevicesMutation: async (_, __, { prisma, user, cookies, response }) => {
            try {
                // @requireAuth directive ensures user is authenticated
                invariant(user, 'User should be authenticated after auth directive validation');

                // Revoke all refresh tokens for the user
                await revokeAllUserTokens(prisma, user.id);

                // Clear cookie for current session
                if (cookies?.refreshToken) {
                    response.headers.set(
                        'Set-Cookie',
                        serialize('refreshToken', '', {
                            ...COOKIE_OPTIONS,
                            maxAge: 0 // Expire immediately
                        })
                    );
                }

                return {
                    success: true,
                    errors: []
                };
            } catch (error) {
                console.error('Error in logoutAllDevicesMutation:', error);
                return {
                    success: false,
                    errors: [{ code: 'INTERNAL_ERROR', message: 'Failed to logout from all devices' }]
                };
            }
        }
    },

    User: {
        id: (parent) => {
            const encoder = getIdEncoder();
            return encoder.encode(parent.id, 'user');
        },
        loggableEvents: async (parent, _, { prisma }) => {
            return prisma.loggableEvent.findMany({
                where: { userId: parent.id },
                include: { labels: true },
                orderBy: { createdAt: 'desc' }
            });
        },
        eventLabels: async (parent, _, { prisma }) => {
            return prisma.eventLabel.findMany({
                where: { userId: parent.id },
                orderBy: { createdAt: 'asc' }
            });
        }
    }
};

export default resolvers;
