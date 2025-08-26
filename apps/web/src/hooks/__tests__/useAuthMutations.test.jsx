import { MockedProvider } from '@apollo/client/testing';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { createMutationResponse } from '../../mocks/mutations';
import {
    useAuthMutations,
    LOGIN_MUTATION,
    REFRESH_TOKEN_MUTATION,
    LOGOUT_MUTATION,
    LOGOUT_ALL_DEVICES_MUTATION
} from '../useAuthMutations';

// Helper functions to create mutation responses
const createLoginMutationResponse = ({
    googleToken,
    clientType = 'WEB',
    accessToken = 'mock-access-token',
    user = { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: LOGIN_MUTATION,
        input: {
            googleToken,
            clientType
        },
        mutationName: 'googleOAuthLoginMutation',
        payload: {
            __typename: 'GoogleOAuthLoginMutationPayload',
            accessToken,
            user: {
                __typename: 'User',
                ...user
            }
        },
        delay,
        gqlError,
        apiErrors,
        nullPayload
    });

const createRefreshTokenMutationResponse = ({
    accessToken = 'new-access-token',
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: REFRESH_TOKEN_MUTATION,
        mutationName: 'refreshTokenMutation',
        payload: {
            __typename: 'RefreshTokenMutationPayload',
            accessToken
        },
        delay,
        gqlError,
        apiErrors,
        nullPayload
    });

const createLogoutMutationResponse = ({
    success = true,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: LOGOUT_MUTATION,
        mutationName: 'logoutMutation',
        payload: {
            __typename: 'LogoutMutationPayload',
            success
        },
        delay,
        gqlError,
        apiErrors,
        nullPayload
    });

const createLogoutAllDevicesMutationResponse = ({
    success = true,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: LOGOUT_ALL_DEVICES_MUTATION,
        input: undefined,
        mutationName: 'logoutAllDevicesMutation',
        payload: {
            __typename: 'LogoutAllDevicesMutationPayload',
            success
        },
        delay,
        gqlError,
        apiErrors,
        nullPayload
    });

describe('useAuthMutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderHookWithProviders = ({ mocks = [] } = {}) => {
        const wrapper = ({ children }) => (
            <MockedProvider mocks={mocks} defaultOptions={{ watchQuery: { errorPolicy: 'all' } }}>
                {children}
            </MockedProvider>
        );

        return renderHook(() => useAuthMutations(), { wrapper });
    };

    describe('hook initialization', () => {
        it('returns all loading and error states', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.loginLoading).toBe(false);
            expect(result.current.refreshLoading).toBe(false);
            expect(result.current.logoutLoading).toBe(false);
            expect(result.current.logoutAllLoading).toBe(false);
            expect(result.current.isLoading).toBe(false);

            expect(result.current.loginError).toBeUndefined();
            expect(result.current.refreshError).toBeUndefined();
            expect(result.current.logoutError).toBeUndefined();
            expect(result.current.logoutAllError).toBeUndefined();
        });
    });

    describe('loginMutation', () => {
        it.each([
            [
                'executes login mutation successfully',
                {
                    googleToken: 'google-oauth-token',
                    clientType: 'WEB',
                    accessToken: 'mock-access-token',
                    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
                },
                {
                    googleOAuthLoginMutation: {
                        __typename: 'GoogleOAuthLoginMutationPayload',
                        accessToken: 'mock-access-token',
                        user: {
                            __typename: 'User',
                            id: 'user-1',
                            email: 'test@example.com',
                            name: 'Test User'
                        },
                        errors: []
                    }
                }
            ],
            [
                'handles login with mobile client type',
                {
                    googleToken: 'google-oauth-token',
                    clientType: 'MOBILE',
                    accessToken: 'mobile-access-token',
                    user: { id: 'user-2', email: 'mobile@example.com', name: 'Mobile User' }
                },
                {
                    googleOAuthLoginMutation: {
                        __typename: 'GoogleOAuthLoginMutationPayload',
                        accessToken: 'mobile-access-token',
                        user: {
                            __typename: 'User',
                            id: 'user-2',
                            email: 'mobile@example.com',
                            name: 'Mobile User'
                        },
                        errors: []
                    }
                }
            ]
        ])('%s', async (_, mockConfig, expectedData) => {
            const mocks = [createLoginMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.loginMutation({
                    variables: {
                        input: {
                            googleToken: mockConfig.googleToken,
                            clientType: mockConfig.clientType
                        }
                    }
                });
            });

            expect(mutationResult.data).toEqual(expectedData);
        });

        it('handles login mutation errors', async () => {
            const mocks = [
                createLoginMutationResponse({
                    googleToken: 'invalid-token',
                    gqlError: new Error('Authentication failed')
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                await expect(
                    result.current.loginMutation({
                        variables: {
                            input: {
                                googleToken: 'invalid-token',
                                clientType: 'WEB'
                            }
                        }
                    })
                ).rejects.toThrow('Authentication failed');
            });

            expect(result.current.loginError).toBeDefined();
        });
    });

    describe('refreshTokenMutation', () => {
        it.each([
            [
                'refreshes token successfully',
                {
                    accessToken: 'refreshed-access-token'
                },
                {
                    refreshTokenMutation: {
                        __typename: 'RefreshTokenMutationPayload',
                        accessToken: 'refreshed-access-token',
                        errors: []
                    }
                }
            ],
            [
                'handles refresh with new token',
                {
                    accessToken: 'brand-new-access-token'
                },
                {
                    refreshTokenMutation: {
                        __typename: 'RefreshTokenMutationPayload',
                        accessToken: 'brand-new-access-token',
                        errors: []
                    }
                }
            ]
        ])('%s', async (_, mockConfig, expectedData) => {
            const mocks = [createRefreshTokenMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.refreshTokenMutation();
            });

            expect(mutationResult.data).toEqual(expectedData);
        });

        it('handles refresh token errors', async () => {
            const mocks = [
                createRefreshTokenMutationResponse({
                    gqlError: new Error('Token expired')
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                await expect(result.current.refreshTokenMutation()).rejects.toThrow('Token expired');
            });

            expect(result.current.refreshError).toBeDefined();
        });
    });

    describe('logoutMutation', () => {
        it.each([
            [
                'executes logout successfully',
                { success: true },
                {
                    logoutMutation: {
                        __typename: 'LogoutMutationPayload',
                        success: true,
                        errors: []
                    }
                }
            ],
            [
                'handles logout failure',
                { success: false },
                {
                    logoutMutation: {
                        __typename: 'LogoutMutationPayload',
                        success: false,
                        errors: []
                    }
                }
            ]
        ])('%s', async (_, mockConfig, expectedData) => {
            const mocks = [createLogoutMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.logoutMutation();
            });

            expect(mutationResult.data).toEqual(expectedData);
        });

        it('handles logout errors', async () => {
            const mocks = [
                createLogoutMutationResponse({
                    gqlError: new Error('Logout failed')
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                await expect(result.current.logoutMutation()).rejects.toThrow('Logout failed');
            });

            expect(result.current.logoutError).toBeDefined();
        });
    });

    describe('logoutAllDevicesMutation', () => {
        it.each([
            [
                'logs out all devices successfully',
                { success: true },
                {
                    logoutAllDevicesMutation: {
                        __typename: 'LogoutAllDevicesMutationPayload',
                        success: true,
                        errors: []
                    }
                }
            ],
            [
                'handles logout all devices failure',
                { success: false },
                {
                    logoutAllDevicesMutation: {
                        __typename: 'LogoutAllDevicesMutationPayload',
                        success: false,
                        errors: []
                    }
                }
            ]
        ])('%s', async (_, mockConfig, expectedData) => {
            const mocks = [createLogoutAllDevicesMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.logoutAllDevicesMutation();
            });

            expect(mutationResult.data).toEqual(expectedData);
        });

        it('handles logout all devices errors', async () => {
            const mocks = [
                createLogoutAllDevicesMutationResponse({
                    gqlError: new Error('Network error')
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                await expect(result.current.logoutAllDevicesMutation()).rejects.toThrow('Network error');
            });

            expect(result.current.logoutAllError).toBeDefined();
        });
    });

    describe('loading states', () => {
        it.each([
            [
                'login',
                () => createLoginMutationResponse({ googleToken: 'token', delay: 100 }),
                (result) =>
                    result.current.loginMutation({
                        variables: {
                            input: {
                                googleToken: 'token',
                                clientType: 'WEB'
                            }
                        }
                    }),
                'loginLoading'
            ],
            [
                'refresh',
                () => createRefreshTokenMutationResponse({ delay: 100 }),
                (result) => result.current.refreshTokenMutation(),
                'refreshLoading'
            ],
            [
                'logout',
                () => createLogoutMutationResponse({ delay: 100 }),
                (result) => result.current.logoutMutation(),
                'logoutLoading'
            ]
        ])('shows loading state during %s', async (mutationName, mockFactory, mutationCall, loadingProp) => {
            const mocks = [mockFactory()];
            const { result } = renderHookWithProviders({ mocks });

            act(() => {
                mutationCall(result);
            });

            expect(result.current[loadingProp]).toBe(true);
            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current[loadingProp]).toBe(false);
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('shows loading state during logout all devices', async () => {
            const mocks = [
                createLogoutAllDevicesMutationResponse({
                    delay: 100
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            act(() => {
                result.current.logoutAllDevicesMutation();
            });

            expect(result.current.logoutAllLoading).toBe(true);
            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.logoutAllLoading).toBe(false);
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('correctly combines multiple loading states', async () => {
            const mocks = [
                createLoginMutationResponse({
                    googleToken: 'token',
                    delay: 100
                }),
                createRefreshTokenMutationResponse({
                    delay: 100
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            // Start login
            act(() => {
                result.current.loginMutation({
                    variables: {
                        input: {
                            googleToken: 'token',
                            clientType: 'WEB'
                        }
                    }
                });
            });

            expect(result.current.loginLoading).toBe(true);
            expect(result.current.refreshLoading).toBe(false);
            expect(result.current.isLoading).toBe(true);

            // Start refresh while login is still loading
            act(() => {
                result.current.refreshTokenMutation();
            });

            expect(result.current.loginLoading).toBe(true);
            expect(result.current.refreshLoading).toBe(true);
            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.loginLoading).toBe(false);
                expect(result.current.refreshLoading).toBe(false);
                expect(result.current.isLoading).toBe(false);
            });
        });
    });

    describe('api errors', () => {
        it('returns API errors from login mutation', async () => {
            const apiErrors = [
                {
                    __typename: 'GenericApiError',
                    code: 'INVALID_TOKEN',
                    field: 'googleToken',
                    message: 'Invalid Google token'
                }
            ];
            const mocks = [
                createLoginMutationResponse({
                    googleToken: 'invalid-token',
                    apiErrors
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.loginMutation({
                    variables: {
                        input: {
                            googleToken: 'invalid-token',
                            clientType: 'WEB'
                        }
                    }
                });
            });

            expect(mutationResult.data.googleOAuthLoginMutation.errors).toEqual(apiErrors);
        });

        it('returns API errors from refresh token mutation', async () => {
            const apiErrors = [
                { __typename: 'GenericApiError', code: 'TOKEN_EXPIRED', message: 'Refresh token has expired' }
            ];
            const mocks = [
                createRefreshTokenMutationResponse({
                    apiErrors
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                mutationResult = await result.current.refreshTokenMutation();
            });

            expect(mutationResult.data.refreshTokenMutation.errors).toEqual(apiErrors);
        });
    });

    describe('null payload handling', () => {
        it.each([
            ['login', 'loginMutation', 'googleOAuthLoginMutation', createLoginMutationResponse],
            ['refresh token', 'refreshTokenMutation', 'refreshTokenMutation', createRefreshTokenMutationResponse],
            ['logout', 'logoutMutation', 'logoutMutation', createLogoutMutationResponse],
            [
                'logout all devices',
                'logoutAllDevicesMutation',
                'logoutAllDevicesMutation',
                createLogoutAllDevicesMutationResponse
            ]
        ])('handles null payload for %s mutation', async (_, mutationName, mutationResponseKey, createResponse) => {
            const mocks = [
                createResponse({
                    nullPayload: true,
                    googleToken: mutationName === 'loginMutation' ? 'token' : undefined
                })
            ];
            const { result } = renderHookWithProviders({ mocks });

            let mutationResult;
            await act(async () => {
                if (mutationName === 'loginMutation') {
                    mutationResult = await result.current[mutationName]({
                        variables: {
                            input: {
                                googleToken: 'token',
                                clientType: 'WEB'
                            }
                        }
                    });
                } else {
                    mutationResult = await result.current[mutationName]();
                }
            });

            expect(mutationResult.data[mutationResponseKey]).toBeNull();
        });
    });
});
