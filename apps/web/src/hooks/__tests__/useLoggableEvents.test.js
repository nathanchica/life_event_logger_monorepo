import { InMemoryCache, gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, act, waitFor } from '@testing-library/react';

import { createMockEventLabelFragment } from '../../mocks/eventLabels';
import { createMockLoggableEventFragment } from '../../mocks/loggableEvent';
import { createMutationResponse } from '../../mocks/mutations';
import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import {
    useLoggableEvents,
    CREATE_LOGGABLE_EVENT_MUTATION,
    UPDATE_LOGGABLE_EVENT_MUTATION,
    DELETE_LOGGABLE_EVENT_MUTATION,
    ADD_TIMESTAMP_TO_EVENT_MUTATION,
    REMOVE_TIMESTAMP_FROM_EVENT_MUTATION
} from '../useLoggableEvents';

// Mock uuid to return a predictable value
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-value'
}));

const createCreateLoggableEventMutationResponse = ({
    id,
    serverGeneratedId,
    name,
    warningThresholdInDays,
    labelIds,
    apiErrors = [],
    gqlError = null,
    nullPayload = false,
    delay = 0
}) =>
    createMutationResponse({
        query: CREATE_LOGGABLE_EVENT_MUTATION,
        input: {
            id,
            name,
            ...(warningThresholdInDays !== undefined ? { warningThresholdInDays } : {}),
            ...(labelIds !== undefined ? { labelIds } : {})
        },
        delay,
        gqlError,
        apiErrors,
        mutationName: 'createLoggableEvent',
        nullPayload,
        payload: {
            __typename: 'CreateLoggableEventMutationPayload',
            tempID: id,
            loggableEvent: {
                __typename: 'LoggableEvent',
                id: serverGeneratedId,
                name,
                timestamps: [],
                warningThresholdInDays: warningThresholdInDays || 0,
                labels:
                    labelIds !== undefined
                        ? labelIds.map((labelId) => ({
                              __typename: 'EventLabel',
                              id: labelId,
                              name: `Label ${labelId}`
                          }))
                        : []
            },
            errors: apiErrors
        }
    });

const createUpdateLoggableEventMutationResponse = ({
    id,
    name,
    warningThresholdInDays,
    labelIds,
    existingEvent = createMockLoggableEventFragment(),
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) =>
    createMutationResponse({
        query: UPDATE_LOGGABLE_EVENT_MUTATION,
        input: {
            id,
            name,
            ...(warningThresholdInDays !== undefined ? { warningThresholdInDays } : {}),
            ...(labelIds !== undefined ? { labelIds } : {})
        },
        delay,
        gqlError,
        apiErrors,
        mutationName: 'updateLoggableEvent',
        nullPayload: customPayload === null,
        payload:
            customPayload !== undefined
                ? customPayload
                : {
                      __typename: 'UpdateLoggableEventMutationPayload',
                      loggableEvent: {
                          ...existingEvent,
                          id,
                          name,
                          ...(warningThresholdInDays !== undefined ? { warningThresholdInDays } : {}),
                          labels: labelIds
                              ? labelIds.map((labelId) => ({
                                    __typename: 'EventLabel',
                                    id: labelId,
                                    name: `Label ${labelId}`
                                }))
                              : []
                      },
                      errors: apiErrors
                  }
    });

const createDeleteLoggableEventMutationResponse = ({
    id,
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) =>
    createMutationResponse({
        query: DELETE_LOGGABLE_EVENT_MUTATION,
        input: { id },
        delay,
        gqlError,
        apiErrors,
        mutationName: 'deleteLoggableEvent',
        nullPayload: customPayload === null,
        payload:
            customPayload !== undefined
                ? customPayload
                : {
                      __typename: 'DeleteLoggableEventMutationPayload',
                      loggableEvent: {
                          id
                      },
                      errors: apiErrors
                  }
    });

const createAddTimestampMutationResponse = ({
    id,
    timestamp,
    existingTimestamps = [],
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) =>
    createMutationResponse({
        query: ADD_TIMESTAMP_TO_EVENT_MUTATION,
        input: { id, timestamp },
        delay,
        gqlError,
        apiErrors,
        mutationName: 'addTimestampToEvent',
        nullPayload: customPayload === null,
        payload:
            customPayload !== undefined
                ? customPayload
                : {
                      __typename: 'AddTimestampToEventMutationPayload',
                      loggableEvent: {
                          __typename: 'LoggableEvent',
                          id,
                          timestamps: [...existingTimestamps, timestamp],
                          name: 'Test Event',
                          warningThresholdInDays: 7,
                          labels: []
                      },
                      errors: apiErrors
                  }
    });

const createRemoveTimestampMutationResponse = ({
    id,
    timestamp,
    remainingTimestamps = [],
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) =>
    createMutationResponse({
        query: REMOVE_TIMESTAMP_FROM_EVENT_MUTATION,
        input: { id, timestamp },
        delay,
        gqlError,
        apiErrors,
        mutationName: 'removeTimestampFromEvent',
        nullPayload: customPayload === null,
        payload:
            customPayload !== undefined
                ? customPayload
                : {
                      __typename: 'RemoveTimestampFromEventMutationPayload',
                      loggableEvent: {
                          __typename: 'LoggableEvent',
                          id,
                          timestamps: remainingTimestamps,
                          name: 'Test Event',
                          warningThresholdInDays: 7,
                          labels: []
                      },
                      errors: apiErrors
                  }
    });

const GET_USER_EVENTS_AND_LABELS = gql`
    query UserEventsAndLabels {
        loggedInUser {
            id
            eventLabels {
                id
                name
            }
            loggableEvents {
                id
                name
                timestamps
                warningThresholdInDays
                labels {
                    id
                    name
                }
            }
        }
    }
`;

describe('useLoggableEvents', () => {
    let apolloCache;
    let mockUser;
    let mockAuthContextValue;

    beforeEach(() => {
        mockUser = createMockUser();
        mockAuthContextValue = createMockAuthContextValue({ user: mockUser });
    });

    afterEach(() => {
        jest.clearAllMocks();
        apolloCache.reset();
    });

    const renderHookWithProviders = ({
        mocks = [],
        authContextValue = mockAuthContextValue,
        startingEventLabels = [],
        startingLoggableEvents = [],
        skipCachePrepopulation = false
    } = {}) => {
        apolloCache = new InMemoryCache({
            typePolicies: {
                LoggableEvent: {
                    fields: {
                        labels: {
                            // Custom merge function to handle merging labels
                            merge(existing = [], incoming = []) {
                                return [...existing, ...incoming];
                            }
                        }
                    }
                }
            }
        });

        if (!skipCachePrepopulation) {
            apolloCache.writeQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                data: {
                    loggedInUser: {
                        __typename: 'User',
                        id: mockUser.id,
                        eventLabels: startingEventLabels,
                        loggableEvents: startingLoggableEvents
                    }
                }
            });
        }

        const wrapper = ({ children }) => (
            <MockedProvider mocks={mocks} defaultOptions={{ watchQuery: { errorPolicy: 'all' } }} cache={apolloCache}>
                <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
            </MockedProvider>
        );

        return renderHook(() => useLoggableEvents(), { wrapper });
    };

    describe('hook initialization', () => {
        it('returns all expected functions and loading states', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createLoggableEvent).toBeInstanceOf(Function);
            expect(result.current.updateLoggableEvent).toBeInstanceOf(Function);
            expect(result.current.deleteLoggableEvent).toBeInstanceOf(Function);
            expect(result.current.addTimestampToEvent).toBeInstanceOf(Function);
            expect(result.current.removeTimestampFromEvent).toBeInstanceOf(Function);
            expect(typeof result.current.createIsLoading).toBe('boolean');
            expect(typeof result.current.updateIsLoading).toBe('boolean');
            expect(typeof result.current.deleteIsLoading).toBe('boolean');
            expect(typeof result.current.addTimestampIsLoading).toBe('boolean');
            expect(typeof result.current.removeTimestampIsLoading).toBe('boolean');
            expect(typeof result.current.loading).toBe('boolean');
        });

        it('initializes with loading states as false', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createIsLoading).toBe(false);
            expect(result.current.updateIsLoading).toBe(false);
            expect(result.current.deleteIsLoading).toBe(false);
            expect(result.current.addTimestampIsLoading).toBe(false);
            expect(result.current.removeTimestampIsLoading).toBe(false);
            expect(result.current.loading).toBe(false);
        });
    });

    describe('createLoggableEvent', () => {
        it.each([
            [
                'creates loggable event successfully',
                {},
                [
                    {
                        id: 'new-event-id',
                        name: 'New Event',
                        warningThresholdInDays: 7
                    }
                ],
                0
            ],
            ['handles when mutation result is empty', { nullPayload: true }, null, 0],
            ['handles gql errors gracefully', { gqlError: new Error('Network error') }, null, 1]
        ])('%s', async (_, mockOptions, expectedEvents, expectedErrorCount) => {
            const mockEventLabels = [
                createMockEventLabelFragment({ id: 'label-1', name: 'Label 1' }),
                createMockEventLabelFragment({ id: 'label-2', name: 'Label 2' })
            ];

            const mocks = [
                createCreateLoggableEventMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-event-id',
                    name: 'New Event',
                    warningThresholdInDays: 7,
                    labelIds: ['label-2'],
                    ...mockOptions
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, startingEventLabels: mockEventLabels });

            await act(async () => {
                result.current.createLoggableEvent({
                    input: {
                        name: 'New Event',
                        warningThresholdInDays: 7,
                        labelIds: ['label-2']
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalledTimes(expectedErrorCount === 0 ? 1 : 0);
                expect(mockOnError).toHaveBeenCalledTimes(expectedErrorCount);
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData?.loggedInUser?.loggableEvents).toHaveLength(expectedEvents ? expectedEvents.length : 0);
            expectedEvents?.forEach((event, index) => {
                expect(cachedData?.loggedInUser?.loggableEvents[index]).toMatchObject(event);
            });
        });

        it('creates loggable event with just the name', async () => {
            const mocks = [
                createCreateLoggableEventMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-event-id',
                    name: 'New Event'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks });

            await act(async () => {
                result.current.createLoggableEvent({
                    input: {
                        name: 'New Event'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData?.loggedInUser?.loggableEvents[0]).toMatchObject({
                id: 'new-event-id',
                name: 'New Event',
                warningThresholdInDays: 0,
                labels: []
            });
        });
    });

    describe('updateLoggableEvent', () => {
        it.each([
            [
                'updates loggable event successfully',
                {},
                [
                    {
                        id: 'existing-event-id',
                        name: 'Updated Event',
                        warningThresholdInDays: 14
                    }
                ],
                0
            ],
            [
                'handles when mutation result is empty and does not update the event',
                { customPayload: null },
                [
                    {
                        id: 'existing-event-id',
                        name: 'Old Event',
                        warningThresholdInDays: 7
                    }
                ],
                0
            ],
            [
                'handles gql errors gracefully and does not update the event',
                { gqlError: new Error('Network error') },
                [
                    {
                        id: 'existing-event-id',
                        name: 'Old Event',
                        warningThresholdInDays: 7
                    }
                ],
                1
            ]
        ])('%s', async (_, mockOptions, expectedEvents, expectedErrorCount) => {
            const mockEventLabels = [
                createMockEventLabelFragment({ id: 'label-1', name: 'Label 1' }),
                createMockEventLabelFragment({ id: 'label-2', name: 'Label 2' })
            ];

            const existingEvent = createMockLoggableEventFragment({
                id: 'existing-event-id',
                name: 'Old Event',
                warningThresholdInDays: 7,
                timestamps: ['2023-01-01T00:00:00Z'],
                labels: [mockEventLabels[1]]
            });

            const mocks = [
                createUpdateLoggableEventMutationResponse({
                    id: 'existing-event-id',
                    name: 'Updated Event',
                    warningThresholdInDays: 14,
                    labelIds: [mockEventLabels[1].id],
                    timestamps: ['2023-01-01T00:00:00Z'],
                    ...mockOptions
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({
                mocks,
                startingEventLabels: mockEventLabels,
                startingLoggableEvents: [existingEvent]
            });

            await act(async () => {
                result.current.updateLoggableEvent({
                    input: {
                        id: 'existing-event-id',
                        name: 'Updated Event',
                        warningThresholdInDays: 14,
                        labelIds: [mockEventLabels[1].id]
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalledTimes(expectedErrorCount === 0 ? 1 : 0);
                expect(mockOnError).toHaveBeenCalledTimes(expectedErrorCount);
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expectedEvents.forEach((expectedEvent, index) => {
                expect(cachedData?.loggedInUser?.loggableEvents[index]).toMatchObject(
                    expect.objectContaining(expectedEvent)
                );
            });
        });

        it('updates just the name of the event', async () => {
            const existingEvent = createMockLoggableEventFragment({
                id: 'existing-event-id',
                name: 'Old Event'
            });

            const mocks = [
                createUpdateLoggableEventMutationResponse({
                    id: 'existing-event-id',
                    name: 'Updated Event'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, startingLoggableEvents: [existingEvent] });

            await act(async () => {
                result.current.updateLoggableEvent({
                    input: {
                        id: 'existing-event-id',
                        name: 'Updated Event'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData?.loggedInUser?.loggableEvents[0]).toMatchObject(
                expect.objectContaining({
                    ...existingEvent,
                    id: 'existing-event-id',
                    name: 'Updated Event'
                })
            );
        });
    });

    describe('deleteLoggableEvent', () => {
        const mockEventToDelete = createMockLoggableEventFragment({
            id: 'event-to-delete',
            name: 'Event to Delete'
        });
        const mockEventToKeep = createMockLoggableEventFragment({
            id: 'event-to-keep',
            name: 'Event to Keep'
        });

        it.each([
            ['deletes loggable event successfully', {}, [mockEventToKeep], 0],
            ['handles when mutation result is empty', { customPayload: null }, [mockEventToKeep, mockEventToDelete], 0],
            [
                'handles gql errors gracefully and does not delete the event',
                { gqlError: new Error('Network error') },
                [mockEventToKeep, mockEventToDelete],
                1
            ]
        ])('%s', async (_, mockOptions, expectedEvents, expectedErrorCount) => {
            const mocks = [
                createDeleteLoggableEventMutationResponse({
                    id: mockEventToDelete.id,
                    ...mockOptions
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({
                mocks,
                startingLoggableEvents: [mockEventToKeep, mockEventToDelete]
            });

            await act(async () => {
                result.current.deleteLoggableEvent({
                    input: { id: mockEventToDelete.id },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalledTimes(expectedErrorCount === 0 ? 1 : 0);
                expect(mockOnError).toHaveBeenCalledTimes(expectedErrorCount);
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData?.loggedInUser?.loggableEvents).toHaveLength(expectedEvents.length);
            expectedEvents.forEach((expectedEvent, index) => {
                expect(cachedData?.loggedInUser?.loggableEvents[index]).toMatchObject(
                    expect.objectContaining(expectedEvent)
                );
            });
        });
    });

    describe('addTimestampToEvent', () => {
        it.each([
            [
                'adds timestamp to event successfully',
                { existingTimestamps: ['2023-01-01T00:00:00Z'] },
                ['2023-01-01T00:00:00Z', '2023-02-01T00:00:00Z'],
                0
            ],
            ['handles when mutation result is empty', { customPayload: null }, ['2023-01-01T00:00:00Z'], 0],
            ['handles gql errors gracefully', { gqlError: new Error('Network error') }, ['2023-01-01T00:00:00Z'], 1]
        ])('%s', async (_, mockOptions, expectedTimestamps, expectedErrorCount) => {
            const existingEvent = createMockLoggableEventFragment({
                id: 'existing-event-id',
                name: 'Test Event',
                timestamps: ['2023-01-01T00:00:00Z']
            });

            const mocks = [
                createAddTimestampMutationResponse({
                    id: 'existing-event-id',
                    timestamp: '2023-02-01T00:00:00Z',
                    ...mockOptions
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, startingLoggableEvents: [existingEvent] });

            await act(async () => {
                result.current.addTimestampToEvent({
                    input: {
                        id: 'existing-event-id',
                        timestamp: '2023-02-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalledTimes(expectedErrorCount === 0 ? 1 : 0);
                expect(mockOnError).toHaveBeenCalledTimes(expectedErrorCount);
            });

            const cachedEvent = apolloCache.readFragment({
                fragment: gql`
                    fragment TestEvent on LoggableEvent {
                        id
                        timestamps
                    }
                `,
                id: apolloCache.identify({ __typename: 'LoggableEvent', id: 'existing-event-id' })
            });

            expect(cachedEvent?.timestamps).toEqual(expectedTimestamps);
        });
    });

    describe('removeTimestampFromEvent', () => {
        it.each([
            [
                'removes timestamp from event successfully',
                { remainingTimestamps: ['2023-02-01T00:00:00Z'] },
                ['2023-02-01T00:00:00Z'],
                0
            ],
            [
                'handles when mutation result is empty',
                { customPayload: null },
                ['2023-01-01T00:00:00Z', '2023-02-01T00:00:00Z'],
                0
            ],
            [
                'handles gql errors gracefully',
                { gqlError: new Error('Network error') },
                ['2023-01-01T00:00:00Z', '2023-02-01T00:00:00Z'],
                1
            ]
        ])('%s', async (_, mockOptions, expectedTimestamps, expectedErrorCount) => {
            const existingEvent = createMockLoggableEventFragment({
                id: 'existing-event-id',
                name: 'Test Event',
                timestamps: ['2023-01-01T00:00:00Z', '2023-02-01T00:00:00Z']
            });

            const mocks = [
                createRemoveTimestampMutationResponse({
                    id: 'existing-event-id',
                    timestamp: '2023-01-01T00:00:00Z',
                    ...mockOptions
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, startingLoggableEvents: [existingEvent] });

            await act(async () => {
                result.current.removeTimestampFromEvent({
                    input: {
                        id: 'existing-event-id',
                        timestamp: '2023-01-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalledTimes(expectedErrorCount === 0 ? 1 : 0);
                expect(mockOnError).toHaveBeenCalledTimes(expectedErrorCount);
            });

            const cachedEvent = apolloCache.readFragment({
                fragment: gql`
                    fragment TestEvent on LoggableEvent {
                        id
                        timestamps
                    }
                `,
                id: apolloCache.identify({ __typename: 'LoggableEvent', id: 'existing-event-id' })
            });

            expect(cachedEvent?.timestamps).toEqual(expectedTimestamps);
        });
    });

    describe('loading states', () => {
        it('shows loading state during create operation', async () => {
            const mocks = [
                createCreateLoggableEventMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-event-id',
                    name: 'New Event',
                    warningThresholdInDays: 7,
                    labelIds: ['label-1'],
                    delay: 100
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            act(() => {
                result.current.createLoggableEvent({
                    input: {
                        name: 'New Event',
                        warningThresholdInDays: 7,
                        labelIds: ['label-1']
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            expect(result.current.createIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('shows loading state during update operation', async () => {
            const mocks = [
                createUpdateLoggableEventMutationResponse({
                    id: 'existing-event-id',
                    name: 'Updated Event',
                    delay: 100
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            act(() => {
                result.current.updateLoggableEvent({
                    input: {
                        id: 'existing-event-id',
                        name: 'Updated Event'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            expect(result.current.updateIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('shows loading state during delete operation', async () => {
            const mocks = [
                createDeleteLoggableEventMutationResponse({
                    id: 'event-to-delete',
                    delay: 100
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            act(() => {
                result.current.deleteLoggableEvent({
                    input: { id: 'event-to-delete' },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            expect(result.current.deleteIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('shows loading state during add timestamp operation', async () => {
            const mocks = [
                createAddTimestampMutationResponse({
                    id: 'existing-event-id',
                    timestamp: '2023-01-01T00:00:00Z',
                    delay: 100
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            act(() => {
                result.current.addTimestampToEvent({
                    input: {
                        id: 'existing-event-id',
                        timestamp: '2023-01-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            expect(result.current.addTimestampIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('shows loading state during remove timestamp operation', async () => {
            const mocks = [
                createRemoveTimestampMutationResponse({
                    id: 'existing-event-id',
                    timestamp: '2023-01-01T00:00:00Z',
                    delay: 100
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            act(() => {
                result.current.removeTimestampFromEvent({
                    input: {
                        id: 'existing-event-id',
                        timestamp: '2023-01-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            expect(result.current.removeTimestampIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });
    });

    describe('cache guard conditions', () => {
        it('handles cache update when user is null for create operation', async () => {
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createCreateLoggableEventMutationResponse({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-event-id',
                    name: 'New Event',
                    warningThresholdInDays: 7,
                    labelIds: ['label-1']
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({
                mocks,
                authContextValue: mockAuthContextWithoutUser,
                skipCachePrepopulation: true
            });

            await act(async () => {
                result.current.createLoggableEvent({
                    input: { name: 'New Event', warningThresholdInDays: 7, labelIds: ['label-1'] },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData).toBeNull();
        });

        it('handles cache update when user is null for delete operation', async () => {
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createDeleteLoggableEventMutationResponse({
                    id: 'event-to-delete'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({
                mocks,
                authContextValue: mockAuthContextWithoutUser,
                skipCachePrepopulation: true
            });

            await act(async () => {
                result.current.deleteLoggableEvent({
                    input: { id: 'event-to-delete' },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });

            const cachedData = apolloCache.readQuery({
                query: GET_USER_EVENTS_AND_LABELS,
                variables: { id: mockUser.id }
            });

            expect(cachedData).toBeNull();
        });

        it('handles optimistic response when event does not exist in cache for update', async () => {
            const mocks = [
                createUpdateLoggableEventMutationResponse({
                    id: 'non-existent-event-id',
                    name: 'Updated Event'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            await act(async () => {
                result.current.updateLoggableEvent({
                    input: {
                        id: 'non-existent-event-id',
                        name: 'Updated Event'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('handles optimistic response when event does not exist in cache for delete', async () => {
            const mocks = [
                createDeleteLoggableEventMutationResponse({
                    id: 'non-existent-event-id'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            await act(async () => {
                result.current.deleteLoggableEvent({
                    input: { id: 'non-existent-event-id' },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('handles optimistic response when event does not exist in cache for add timestamp', async () => {
            const mocks = [
                createAddTimestampMutationResponse({
                    id: 'non-existent-event-id',
                    timestamp: '2023-01-01T00:00:00Z'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            await act(async () => {
                result.current.addTimestampToEvent({
                    input: {
                        id: 'non-existent-event-id',
                        timestamp: '2023-01-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });

        it('handles optimistic response when event does not exist in cache for remove timestamp', async () => {
            const mocks = [
                createRemoveTimestampMutationResponse({
                    id: 'non-existent-event-id',
                    timestamp: '2023-01-01T00:00:00Z'
                })
            ];
            const mockOnCompleted = jest.fn();
            const mockOnError = jest.fn();

            const { result } = renderHookWithProviders({ mocks, skipCachePrepopulation: true });

            await act(async () => {
                result.current.removeTimestampFromEvent({
                    input: {
                        id: 'non-existent-event-id',
                        timestamp: '2023-01-01T00:00:00Z'
                    },
                    onCompleted: mockOnCompleted,
                    onError: mockOnError
                });
            });

            await waitFor(() => {
                expect(mockOnCompleted).toHaveBeenCalled();
                expect(mockOnError).not.toHaveBeenCalled();
            });
        });
    });
});
