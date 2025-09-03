import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import * as Sentry from '@sentry/react';

import { tokenStorage } from './tokenStorage';

/**
 * Auth link that adds the access token to every request
 * It retrieves the token from storage, fetching a new one if necessary
 */
export const createAuthLink = () => {
    return setContext(async (_, { headers }) => {
        const token = await tokenStorage.getValidAccessToken();
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : ''
            }
        };
    });
};

/**
 * Error link for handling auth errors
 */
export const createErrorLink = () => {
    return onError(({ graphQLErrors, networkError, operation }) => {
        if (graphQLErrors) {
            for (const err of graphQLErrors) {
                // Check for UNAUTHORIZED error code (from auth directive)
                if (err.extensions?.code === 'UNAUTHORIZED') {
                    tokenStorage.clear();
                } else {
                    // Log other GraphQL errors to Sentry
                    Sentry.captureException(new Error(err.message), {
                        contexts: {
                            graphql: {
                                operationName: operation.operationName,
                                extensions: err.extensions
                            }
                        }
                    });
                }
            }
        }

        // Log network errors to Sentry
        if (networkError) {
            Sentry.captureException(networkError, {
                contexts: {
                    graphql: {
                        operationName: operation.operationName
                    }
                }
            });
        }
    });
};
