import { fromPromise } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { tokenStorage } from './tokenStorage';

// Type for pending request queue
interface PendingRequest {
    resolve: (token: string | null) => void;
    reject: (error: Error) => void;
}

/**
 * Auth link that adds the access token to every request
 */
export const createAuthLink = () => {
    return setContext((_, { headers }) => {
        // Get token from storage service (always fresh due to expiry check)
        const token = tokenStorage.getAccessToken();
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : ''
            }
        };
    });
};

/**
 * Error link for handling auth errors and retrying with refreshed tokens
 * @param refreshAuthFn - Function to refresh the access token
 */
export const createErrorLink = (refreshAuthFn: () => Promise<boolean>) => {
    let isRefreshing = false;
    let pendingRequests: PendingRequest[] = [];

    const processQueue = (error: Error | null, token: string | null = null) => {
        pendingRequests.forEach((prom) => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        pendingRequests = [];
    };

    return onError(({ graphQLErrors, operation, forward }) => {
        if (graphQLErrors) {
            for (const err of graphQLErrors) {
                // Check for UNAUTHORIZED error code (from auth directive)
                if (err.extensions?.code === 'UNAUTHORIZED') {
                    let retryRequest: ReturnType<typeof fromPromise>;

                    if (!isRefreshing) {
                        isRefreshing = true;
                        retryRequest = fromPromise(
                            refreshAuthFn()
                                .then((success) => {
                                    if (!success) {
                                        throw new Error('Token refresh failed');
                                    }
                                    const token = tokenStorage.getAccessToken();
                                    processQueue(null, token);
                                    return token;
                                })
                                .catch((error: Error) => {
                                    processQueue(error, null);
                                    // Redirect to login on refresh failure
                                    window.location.href = '/';
                                    return null;
                                })
                                .finally(() => {
                                    isRefreshing = false;
                                })
                        );
                    } else {
                        // Token refresh in progress, queue this request
                        retryRequest = fromPromise(
                            new Promise<string | null>((resolve, reject) => {
                                pendingRequests.push({ resolve, reject });
                            })
                        );
                    }

                    return retryRequest.flatMap((token) => {
                        // Retry the request with new token
                        operation.setContext({
                            headers: {
                                ...operation.getContext().headers,
                                authorization: token ? `Bearer ${token}` : ''
                            }
                        });
                        return forward(operation);
                    });
                }
            }
        }
    });
};
