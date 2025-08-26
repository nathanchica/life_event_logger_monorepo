import { ApolloClient, ApolloLink, Observable, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { OperationDefinitionNode } from 'graphql';

import { createAuthLink, createErrorLink } from './authLink';
import { cache, setupCachePersistence } from './cache';

import LoggableEventCard from '../components/EventCards/LoggableEventCard';
import EventLabel from '../components/EventLabels/EventLabel';
import { GET_LOGGABLE_EVENTS_FOR_USER } from '../components/LoggableEvents/LoggableEventsGQL';
import { offlineUser } from '../providers/AuthProvider';
import { LoggableEventFragment, EventLabelFragment, UserFragment } from '../utils/types';

/**
 * Helper function to read a LoggableEvent from the cache
 */
const readLoggableEventFromCache = (eventId: string): LoggableEventFragment | null => {
    try {
        return cache.readFragment<LoggableEventFragment>({
            id: `LoggableEvent:${eventId}`,
            fragment: LoggableEventCard.fragments.loggableEvent
        });
    } catch {
        // Event not found in cache or invalid eventId - return null so caller can handle missing data
        return null;
    }
};

/**
 * Helper function to read an EventLabel from the cache
 */
const readEventLabelFromCache = (labelId: string): EventLabelFragment | null => {
    try {
        return cache.readFragment<EventLabelFragment>({
            id: `EventLabel:${labelId}`,
            fragment: EventLabel.fragments.eventLabel
        });
    } catch {
        // Label not found in cache or invalid labelId - return null so caller can handle missing data
        return null;
    }
};

/**
 * Mock Apollo Link for offline development and testing.
 *
 * This link intercepts GraphQL operations and provides simulated responses for:
 * - Offline functionality testing
 * - Development without server dependencies
 * - Unit and integration testing
 * - Demonstrations and prototyping
 *
 * What it does:
 * - Intercepts mutation operations (CREATE, UPDATE, DELETE)
 * - Returns mock successful responses with realistic data structure
 * - Provides immediate responses for instant feedback
 * - Passes queries through to cache (enabling offline data access)
 * - Enables testing of optimistic UI patterns
 *
 * Used when the app is in offline mode or when running tests.
 */
const offlineMockLink = new ApolloLink((operation) => {
    const definition = operation.query.definitions[0] as OperationDefinitionNode;

    // Handle mutations with mock responses
    if (definition.operation === 'mutation') {
        return new Observable((observer) => {
            const { operationName, variables } = operation;
            const inputVariables = variables.input;

            // Mock CreateLoggableEvent mutation response
            if (operationName === 'CreateLoggableEvent') {
                const newId = inputVariables?.id || `server-${Date.now()}`;
                const labelIds = inputVariables?.labelIds || [];

                // Read labels from cache if IDs provided
                const labels = labelIds.map((id: string) => readEventLabelFromCache(id)).filter(Boolean);

                observer.next({
                    data: {
                        createLoggableEvent: {
                            __typename: 'CreateLoggableEventMutationPayload',
                            tempID: newId,
                            loggableEvent: {
                                __typename: 'LoggableEvent',
                                id: newId,
                                name: inputVariables?.name || '',
                                timestamps: [],
                                warningThresholdInDays: inputVariables?.warningThresholdInDays || 0,
                                labels
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock UpdateLoggableEvent mutation response
            else if (operationName === 'UpdateLoggableEvent') {
                const existingEvent = readLoggableEventFromCache(inputVariables?.id);
                const labelIds = inputVariables?.labelIds;

                // If labelIds provided, read them from cache; otherwise preserve existing
                const labels = labelIds
                    ? labelIds.map((id: string) => readEventLabelFromCache(id)).filter(Boolean)
                    : existingEvent?.labels || [];

                observer.next({
                    data: {
                        updateLoggableEvent: {
                            __typename: 'UpdateLoggableEventMutationPayload',
                            loggableEvent: {
                                __typename: 'LoggableEvent',
                                id: inputVariables?.id,
                                name: inputVariables?.name ?? existingEvent?.name ?? '',
                                timestamps: existingEvent?.timestamps || [],
                                warningThresholdInDays:
                                    inputVariables?.warningThresholdInDays ??
                                    existingEvent?.warningThresholdInDays ??
                                    0,
                                labels
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock CreateEventLabel mutation response
            else if (operationName === 'CreateEventLabel') {
                const newId = inputVariables?.id || `server-${Date.now()}`;
                observer.next({
                    data: {
                        createEventLabel: {
                            __typename: 'CreateEventLabelMutationPayload',
                            tempID: newId,
                            eventLabel: {
                                __typename: 'EventLabel',
                                id: newId,
                                name: inputVariables?.name || ''
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock UpdateEventLabel mutation response
            else if (operationName === 'UpdateEventLabel') {
                const existingLabel = readEventLabelFromCache(inputVariables?.id);

                observer.next({
                    data: {
                        updateEventLabel: {
                            __typename: 'UpdateEventLabelMutationPayload',
                            eventLabel: {
                                __typename: 'EventLabel',
                                id: inputVariables?.id,
                                name: inputVariables?.name ?? existingLabel?.name ?? ''
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock AddTimestampToEvent mutation response
            else if (operationName === 'AddTimestampToEvent') {
                const existingEvent = readLoggableEventFromCache(inputVariables?.id);

                observer.next({
                    data: {
                        addTimestampToEvent: {
                            __typename: 'AddTimestampToEventMutationPayload',
                            loggableEvent: {
                                __typename: 'LoggableEvent',
                                id: inputVariables?.id,
                                name: existingEvent?.name || '',
                                timestamps: [...(existingEvent?.timestamps || []), inputVariables?.timestamp],
                                warningThresholdInDays: existingEvent?.warningThresholdInDays || 0,
                                labels: existingEvent?.labels || []
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock RemoveTimestampFromEvent mutation response
            else if (operationName === 'RemoveTimestampFromEvent') {
                const existingEvent = readLoggableEventFromCache(inputVariables?.id);

                observer.next({
                    data: {
                        removeTimestampFromEvent: {
                            __typename: 'RemoveTimestampFromEventMutationPayload',
                            loggableEvent: {
                                __typename: 'LoggableEvent',
                                id: inputVariables?.id,
                                name: existingEvent?.name || '',
                                timestamps:
                                    existingEvent?.timestamps?.filter(
                                        (timestamp) => timestamp !== inputVariables?.timestamp
                                    ) || [],
                                warningThresholdInDays: existingEvent?.warningThresholdInDays || 0,
                                labels: existingEvent?.labels || []
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock DeleteLoggableEvent mutation response
            else if (operationName === 'DeleteLoggableEvent') {
                const existingEvent = readLoggableEventFromCache(inputVariables?.id);

                observer.next({
                    data: {
                        deleteLoggableEvent: {
                            __typename: 'DeleteLoggableEventMutationPayload',
                            loggableEvent: {
                                __typename: 'LoggableEvent',
                                id: inputVariables?.id,
                                name: existingEvent?.name ?? '',
                                timestamps: existingEvent?.timestamps || [],
                                warningThresholdInDays: existingEvent?.warningThresholdInDays ?? 0,
                                labels: existingEvent?.labels || []
                            },
                            errors: []
                        }
                    }
                });
            }
            // Mock DeleteEventLabel mutation response
            else if (operationName === 'DeleteEventLabel') {
                observer.next({
                    data: {
                        deleteEventLabel: {
                            __typename: 'DeleteEventLabelMutationPayload',
                            eventLabel: {
                                __typename: 'EventLabel',
                                id: inputVariables?.id
                            },
                            errors: []
                        }
                    }
                });
            }

            observer.complete();
        });
    }

    // For queries, pass through to next link in chain (eventually hits cache)
    // This enables reading cached data when offline
    // Return empty observable to let Apollo read from cache
    return Observable.of();
});

// HTTP link for production use, connecting to the GraphQL server
const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL || '/api/graphql',
    credentials: 'include' // Important: Include cookies for refresh tokens
});

/**
 * Creates and configures the Apollo Client instance.
 *
 * Sets up:
 * - Cache persistence for offline support
 * - Appropriate link based on mode (mock for offline, HTTP for online)
 * - Optimized fetch policies for offline-first experience
 *
 * @param isOfflineMode - Whether to use mock responses instead of real server
 * @returns Configured Apollo Client instance
 */
export const createApolloClient = async (isOfflineMode = false) => {
    // Setup cache persistence to localStorage for offline support
    await setupCachePersistence();

    // Create the Apollo client with a temporary link
    const apolloClient = new ApolloClient({
        link: ApolloLink.empty(), // Temporary link, will be set below
        cache,
        defaultOptions: {
            watchQuery: {
                errorPolicy: 'all'
            },
            query: {
                errorPolicy: 'all'
            }
        }
    });

    // Configure the appropriate link based on mode
    let link: ApolloLink;

    if (isOfflineMode) {
        link = offlineMockLink;
    } else {
        // Create links only once
        const authLink = createAuthLink();
        const errorLink = createErrorLink();

        // Create context link that includes the client reference
        const contextLink = setContext((_, prevContext) => ({
            ...prevContext,
            client: apolloClient
        }));

        // Compose all links in the correct order
        link = ApolloLink.from([contextLink, errorLink, authLink, httpLink]);
    }

    // Set the final link on the client
    apolloClient.setLink(link);

    // In offline mode, initialize the cache with the offline user if it doesn't exist
    if (isOfflineMode) {
        initializeOfflineUser();
    }

    return apolloClient;
};

/**
 * Initializes the offline user in the cache if not already present.
 * This ensures the app has a valid user structure for offline mode.
 */
const initializeOfflineUser = () => {
    try {
        const existingData = cache.readQuery<{ loggedInUser: UserFragment }>({
            query: GET_LOGGABLE_EVENTS_FOR_USER
        });

        // If user already exists, no need to initialize
        if (existingData?.loggedInUser) {
            return;
        }
    } catch {
        // User doesn't exist or query fails, proceed with initialization
    }

    // Initialize the offline user with proper structure
    cache.writeQuery({
        query: GET_LOGGABLE_EVENTS_FOR_USER,
        data: {
            loggedInUser: {
                __typename: 'User',
                id: offlineUser.id,
                loggableEvents: [],
                eventLabels: []
            }
        }
    });
};
