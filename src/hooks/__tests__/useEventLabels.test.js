import { InMemoryCache, gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, act, waitFor } from '@testing-library/react';

import { createMutationResponse } from '../../mocks/mutations';
import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import {
    useEventLabels,
    CREATE_EVENT_LABEL_MUTATION,
    UPDATE_EVENT_LABEL_MUTATION,
    DELETE_EVENT_LABEL_MUTATION
} from '../useEventLabels';

// Mock uuid to return a predictable value
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-value'
}));

const createCreateEventLabelMutationResponse = ({
    id,
    name,
    serverGeneratedId,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: CREATE_EVENT_LABEL_MUTATION,
        input: {
            id,
            name
        },
        mutationName: 'createEventLabel',
        payload: {
            __typename: 'CreateEventLabelMutationPayload',
            tempID: serverGeneratedId,
            eventLabel: {
                __typename: 'EventLabel',
                id: serverGeneratedId,
                name
            }
        },
        delay,
        gqlError,
        apiErrors,
        nullPayload
    });

const createUpdateEventLabelMutationResponse = ({
    id,
    name,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: UPDATE_EVENT_LABEL_MUTATION,
        input: {
            id,
            name
        },
        mutationName: 'updateEventLabel',
        payload: {
            __typename: 'UpdateEventLabelMutationPayload',
            eventLabel: {
                __typename: 'EventLabel',
                id,
                name
            },
            errors: apiErrors
        },
        delay,
        gqlError,
        nullPayload
    });

const createDeleteEventLabelMutationResponse = ({
    id,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: DELETE_EVENT_LABEL_MUTATION,
        input: {
            id
        },
        mutationName: 'deleteEventLabel',
        payload: {
            __typename: 'DeleteEventLabelMutationPayload',
            eventLabel: {
                __typename: 'EventLabel',
                id
            },
            errors: apiErrors
        },
        delay,
        gqlError,
        nullPayload
    });

const GET_USER_QUERY = gql`
    query GetUser($id: String!) {
        user(id: $id) {
            id
            eventLabels {
                id
                name
            }
        }
    }
`;

describe('useEventLabels', () => {
    let apolloCache;
    let mockUser;
    let mockAuthContextValue;

    beforeEach(() => {
        jest.clearAllMocks();

        apolloCache = new InMemoryCache();
        mockUser = createMockUser();
        mockAuthContextValue = createMockAuthContextValue({ user: mockUser });
    });

    const renderHookWithProviders = ({ mocks = [], authContextValue = mockAuthContextValue } = {}) => {
        const wrapper = ({ children }) => (
            <MockedProvider mocks={mocks} defaultOptions={{ watchQuery: { errorPolicy: 'all' } }} cache={apolloCache}>
                <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
            </MockedProvider>
        );

        return renderHook(() => useEventLabels(), { wrapper });
    };

    const prepopulateCache = (startingEventLabels = []) => {
        apolloCache.writeQuery({
            query: GET_USER_QUERY,
            variables: { id: mockUser.id },
            data: {
                user: {
                    __typename: 'User',
                    id: mockUser.id,
                    eventLabels: startingEventLabels
                }
            }
        });
    };

    describe('hook initialization', () => {
        it('returns all expected functions and loading states', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createEventLabel).toBeInstanceOf(Function);
            expect(result.current.updateEventLabel).toBeInstanceOf(Function);
            expect(result.current.deleteEventLabel).toBeInstanceOf(Function);
            expect(typeof result.current.createIsLoading).toBe('boolean');
            expect(typeof result.current.updateIsLoading).toBe('boolean');
            expect(typeof result.current.deleteIsLoading).toBe('boolean');
            expect(typeof result.current.loading).toBe('boolean');
        });

        it('initializes with loading states as false', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createIsLoading).toBe(false);
            expect(result.current.updateIsLoading).toBe(false);
            expect(result.current.deleteIsLoading).toBe(false);
            expect(result.current.loading).toBe(false);
        });
    });

    describe('createEventLabel', () => {
        it.each([
            [
                'creates event label successfully',
                {
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label'
                },
                [{ id: 'new-label-id', name: 'New Label' }],
                0
            ],
            [
                'handles when mutation result is empty',
                {
                    id: 'temp-mocked-uuid-value',
                    name: 'New Label',
                    nullPayload: true
                },
                [],
                0
            ],
            [
                'handles gql errors gracefully',
                {
                    id: 'temp-mocked-uuid-value',
                    name: 'New Label',
                    gqlError: new Error('Network error')
                },
                [],
                1
            ]
        ])('%s', async (_, mockConfig, expectedLabels, onErrorCallCount) => {
            prepopulateCache();
            const mockOnError = jest.fn();

            const mocks = [createCreateEventLabelMutationResponse(mockConfig)];

            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.createEventLabel({ input: { name: 'New Label' }, onError: mockOnError });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_QUERY,
                    variables: { id: mockUser.id }
                });

                expect(cachedData?.user?.eventLabels).toHaveLength(expectedLabels.length);

                expectedLabels.forEach((expectedLabel, index) => {
                    expect(cachedData?.user?.eventLabels[index]).toMatchObject(expectedLabel);
                });

                expect(mockOnError).toHaveBeenCalledTimes(onErrorCallCount);
            });
        });
    });

    describe('updateEventLabel', () => {
        it.each([
            [
                'updates event label successfully',
                {
                    id: 'existing-label-id',
                    name: 'Updated Label'
                },
                [
                    {
                        __typename: 'EventLabel',
                        id: 'existing-label-id',
                        name: 'Updated Label'
                    }
                ],
                0
            ],
            [
                'handles when mutation result is empty and does not update the label',
                {
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    nullPayload: true
                },
                [
                    {
                        __typename: 'EventLabel',
                        id: 'existing-label-id',
                        name: 'Old Label'
                    }
                ],
                0
            ],
            [
                'handles gql errors gracefully and does not update the label',
                {
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    gqlError: new Error('Network error')
                },
                [
                    {
                        __typename: 'EventLabel',
                        id: 'existing-label-id',
                        name: 'Old Label'
                    }
                ],
                1
            ]
        ])('%s', async (_, mockConfig, expectedLabels, onErrorCallCount) => {
            prepopulateCache([{ __typename: 'EventLabel', id: 'existing-label-id', name: 'Old Label' }]);
            const mockOnError = jest.fn();

            const mocks = [createUpdateEventLabelMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.updateEventLabel({
                    input: { id: mockConfig.id, name: mockConfig.name },
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_QUERY,
                    variables: { id: mockUser.id }
                });

                expect(cachedData?.user?.eventLabels).toEqual(expectedLabels);
                expect(mockOnError).toHaveBeenCalledTimes(onErrorCallCount);
            });
        });
    });

    describe('deleteEventLabel', () => {
        it.each([
            [
                'deletes event label successfully',
                {
                    id: 'existing-label-id'
                },
                [],
                0
            ],
            [
                'returns null when mutation result is empty',
                {
                    id: 'existing-label-id',
                    nullPayload: true
                },
                [{ __typename: 'EventLabel', id: 'existing-label-id', name: 'Test Label' }],
                0
            ],
            [
                'handles gql errors gracefully and does not delete the event label',
                {
                    id: 'existing-label-id',
                    gqlError: new Error('Network error')
                },
                [{ __typename: 'EventLabel', id: 'existing-label-id', name: 'Test Label' }],
                1
            ]
        ])('%s', async (_, mockConfig, expectedLabels, onErrorCallCount) => {
            prepopulateCache([{ __typename: 'EventLabel', id: 'existing-label-id', name: 'Test Label' }]);
            const mockOnError = jest.fn();

            const mocks = [createDeleteEventLabelMutationResponse(mockConfig)];
            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.deleteEventLabel({ input: { id: 'existing-label-id' }, onError: mockOnError });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_QUERY,
                    variables: { id: mockUser.id }
                });

                expect(cachedData?.user?.eventLabels).toEqual(expectedLabels);
                expect(mockOnError).toHaveBeenCalledTimes(onErrorCallCount);
            });
        });
    });

    describe('loading states', () => {
        it('shows loading state during create operation', async () => {
            const mocks = [
                createCreateEventLabelMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders({ mocks });

            act(() => {
                result.current.createEventLabel({ input: { name: 'New Label' } });
            });

            expect(result.current.createIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });

        it('shows loading state during update operation', async () => {
            const mocks = [
                createUpdateEventLabelMutationResponse({
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders({ mocks });

            act(() => {
                result.current.updateEventLabel({ input: { id: 'existing-label-id', name: 'Updated Label' } });
            });

            expect(result.current.updateIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });

        it('shows loading state during delete operation', async () => {
            const mocks = [
                createDeleteEventLabelMutationResponse({
                    id: 'label-to-delete',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders({ mocks });

            act(() => {
                result.current.deleteEventLabel({ input: { id: 'label-to-delete' } });
            });

            expect(result.current.deleteIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });
    });

    describe('cache guard conditions', () => {
        it('handles cache update when user is null for create operation', async () => {
            // Test the case where user.id is undefined - should trigger early return in cache update
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createCreateEventLabelMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label'
                })
            ];

            const { result } = renderHookWithProviders({ mocks, authContextValue: mockAuthContextWithoutUser });

            await act(async () => {
                result.current.createEventLabel({ input: { name: 'New Label' } });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_QUERY,
                    variables: { id: mockUser.id }
                });

                expect(cachedData).toBeNull();
            });
        });

        it('handles cache update when user is null for delete operation', async () => {
            // Test the case where user.id is undefined - should trigger early return in cache update
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createDeleteEventLabelMutationResponse({
                    id: 'label-to-delete'
                })
            ];

            const { result } = renderHookWithProviders({ mocks, authContextValue: mockAuthContextWithoutUser });

            await act(async () => {
                result.current.deleteEventLabel({ input: { id: 'label-to-delete' } });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_QUERY,
                    variables: { id: mockUser.id }
                });

                expect(cachedData).toBeNull();
            });
        });
    });

    describe('cascade deletion from loggable events', () => {
        const GET_USER_EVENTS_AND_LABELS_QUERY = gql`
            query GetUser($id: String!) {
                user(id: $id) {
                    id
                    eventLabels {
                        id
                        name
                    }
                    loggableEvents {
                        id
                        name
                        labels {
                            id
                            name
                        }
                    }
                }
            }
        `;
        const mockLabelToKeep = {
            __typename: 'EventLabel',
            id: 'label-to-keep',
            name: 'Label to Keep'
        };
        const mockLabelToDelete = {
            __typename: 'EventLabel',
            id: 'label-to-delete',
            name: 'Label to Delete'
        };

        it('removes deleted label from events that reference it', async () => {
            // Pre-populate cache with user data including events with labels
            apolloCache.writeQuery({
                query: GET_USER_EVENTS_AND_LABELS_QUERY,
                variables: { id: mockUser.id },
                data: {
                    user: {
                        __typename: 'User',
                        id: mockUser.id,
                        eventLabels: [mockLabelToDelete, mockLabelToKeep],
                        loggableEvents: [
                            {
                                __typename: 'LoggableEvent',
                                id: 'event-1',
                                name: 'Event with Multiple Labels',
                                labels: [mockLabelToDelete, mockLabelToKeep]
                            },
                            {
                                __typename: 'LoggableEvent',
                                id: 'event-2',
                                name: 'Event with Single Label',
                                labels: [mockLabelToDelete]
                            },
                            {
                                __typename: 'LoggableEvent',
                                id: 'event-3',
                                name: 'Event with No Target Label',
                                labels: [mockLabelToKeep]
                            }
                        ]
                    }
                }
            });

            const mocks = [
                createDeleteEventLabelMutationResponse({
                    id: mockLabelToDelete.id
                })
            ];

            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.deleteEventLabel({ input: { id: mockLabelToDelete.id } });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_EVENTS_AND_LABELS_QUERY,
                    variables: { id: mockUser.id }
                });

                // Event 1 should have the deleted label removed, keeping the other label
                expect(cachedData?.user?.loggableEvents[0]).toEqual({
                    __typename: 'LoggableEvent',
                    id: 'event-1',
                    name: 'Event with Multiple Labels',
                    labels: [mockLabelToKeep]
                });

                // Event 2 should have empty labels array after deletion
                expect(cachedData?.user?.loggableEvents[1]).toEqual({
                    __typename: 'LoggableEvent',
                    id: 'event-2',
                    name: 'Event with Single Label',
                    labels: []
                });

                // Event 3 should remain unchanged (didn't have the deleted label)
                expect(cachedData?.user?.loggableEvents[2]).toEqual({
                    __typename: 'LoggableEvent',
                    id: 'event-3',
                    name: 'Event with No Target Label',
                    labels: [
                        {
                            __typename: 'EventLabel',
                            id: 'label-to-keep',
                            name: 'Label to Keep'
                        }
                    ]
                });
            });
        });

        it('handles events with empty or null labels gracefully', async () => {
            // Pre-populate cache with events that have null/empty labels
            apolloCache.writeQuery({
                query: GET_USER_EVENTS_AND_LABELS_QUERY,
                variables: { id: mockUser.id },
                data: {
                    user: {
                        __typename: 'User',
                        id: mockUser.id,
                        eventLabels: [
                            {
                                __typename: 'EventLabel',
                                id: 'label-to-delete',
                                name: 'Label to Delete'
                            }
                        ],
                        loggableEvents: [
                            {
                                __typename: 'LoggableEvent',
                                id: 'event-1',
                                name: 'Event with Empty Labels',
                                labels: []
                            },
                            {
                                __typename: 'LoggableEvent',
                                id: 'event-2',
                                name: 'Event with Null Labels',
                                labels: null
                            }
                        ]
                    }
                }
            });

            const mocks = [
                createDeleteEventLabelMutationResponse({
                    id: 'label-to-delete'
                })
            ];

            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.deleteEventLabel({ input: { id: 'label-to-delete' } });
            });

            await waitFor(() => {
                const cachedData = apolloCache.readQuery({
                    query: GET_USER_EVENTS_AND_LABELS_QUERY,
                    variables: { id: mockUser.id }
                });

                // Events with empty/null labels should remain unchanged
                expect(cachedData?.user?.loggableEvents[0]).toEqual(
                    expect.objectContaining({
                        id: 'event-1',
                        labels: []
                    })
                );

                expect(cachedData?.user?.loggableEvents[1]).toEqual(
                    expect.objectContaining({
                        id: 'event-2',
                        labels: null
                    })
                );
            });
        });
    });
});
