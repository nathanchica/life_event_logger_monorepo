import { gql, useMutation, Reference } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../providers/AuthProvider';
import { LoggableEvent } from '../utils/types';

// Types for mutation inputs
export interface CreateLoggableEventInput {
    name: string;
    warningThresholdInDays?: number;
    labelIds?: string[];
}

export interface UpdateLoggableEventInput {
    id: string;
    name: string;
    warningThresholdInDays?: number;
    labelIds?: string[];
}

export interface DeleteLoggableEventInput {
    id: string;
}

export interface AddTimestampInput {
    eventId: string;
    timestamp: string; // ISO string
}

export interface RemoveTimestampInput {
    eventId: string;
    timestamp: string; // ISO string
}

const LOGGABLE_EVENT_FRAGMENT = gql`
    fragment LoggableEventFragment on LoggableEvent {
        id
        name
        timestamps
        warningThresholdInDays
        createdAt
        labels {
            id
            name
            createdAt
        }
    }
`;

// GraphQL mutations
const CREATE_LOGGABLE_EVENT = gql`
    mutation CreateLoggableEvent($input: CreateLoggableEventInput!) {
        createLoggableEvent(input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const UPDATE_LOGGABLE_EVENT = gql`
    mutation UpdateLoggableEvent($input: UpdateLoggableEventInput!) {
        updateLoggableEvent(input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const DELETE_LOGGABLE_EVENT = gql`
    mutation DeleteLoggableEvent($input: DeleteLoggableEventInput!) {
        deleteLoggableEvent(input: $input) {
            id
        }
    }
`;

const ADD_TIMESTAMP_TO_EVENT = gql`
    mutation AddTimestampToEvent($input: AddTimestampInput!) {
        addTimestampToEvent(input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const REMOVE_TIMESTAMP_FROM_EVENT = gql`
    mutation RemoveTimestampFromEvent($input: RemoveTimestampInput!) {
        removeTimestampFromEvent(input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

/**
 * Hook for managing loggable events with Apollo mutations.
 * Provides create, update, delete, and timestamp operations with optimistic updates.
 */
export const useLoggableEvents = () => {
    const { user } = useAuth();

    const [createLoggableEventMutation, { loading: createIsLoading }] = useMutation(CREATE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            createLoggableEvent: {
                __typename: 'LoggableEvent',
                id: `temp-${uuidv4()}`,
                name: variables.input.name,
                timestamps: [],
                warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        }),
        update: (cache, { data }) => {
            if (!data?.createLoggableEvent || !user?.id) return;

            // Add new event to user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existing = []) {
                        const newEventRef = cache.writeFragment({
                            fragment: LOGGABLE_EVENT_FRAGMENT,
                            data: data.createLoggableEvent
                        });
                        return [...existing, newEventRef];
                    }
                }
            });
        }
    });

    const [updateLoggableEventMutation, { loading: updateIsLoading }] = useMutation(UPDATE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            updateLoggableEvent: {
                __typename: 'LoggableEvent',
                id: variables.input.id,
                name: variables.input.name,
                timestamps: [],
                warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        })
    });

    const [deleteLoggableEventMutation, { loading: deleteIsLoading }] = useMutation(DELETE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            deleteLoggableEvent: {
                __typename: 'LoggableEvent',
                id: variables.input.id
            }
        }),
        update: (cache, { data }) => {
            if (!data?.deleteLoggableEvent || !user?.id) return;

            // Remove event from user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existing = [], { readField }) {
                        return existing.filter(
                            (eventRef: Reference) => readField('id', eventRef) !== data.deleteLoggableEvent.id
                        );
                    }
                }
            });

            // Remove the event from cache completely
            cache.evict({ id: cache.identify({ __typename: 'LoggableEvent', id: data.deleteLoggableEvent.id }) });
        }
    });

    const [addTimestampMutation, { loading: addTimestampIsLoading }] = useMutation(ADD_TIMESTAMP_TO_EVENT, {
        optimisticResponse: (variables) => ({
            addTimestampToEvent: {
                __typename: 'LoggableEvent',
                id: variables.input.eventId,
                // We can't easily get the current timestamps here, but Apollo will merge this
                timestamps: [variables.input.timestamp],
                name: '',
                warningThresholdInDays: 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        })
    });

    const [removeTimestampMutation, { loading: removeTimestampIsLoading }] = useMutation(REMOVE_TIMESTAMP_FROM_EVENT);

    // Wrapper functions with error handling
    const createLoggableEvent = async (
        name: string,
        warningThresholdInDays?: number,
        labelIds?: string[]
    ): Promise<LoggableEvent | null> => {
        try {
            const result = await createLoggableEventMutation({
                variables: {
                    input: {
                        name,
                        warningThresholdInDays,
                        labelIds,
                        id: `temp-${uuidv4()}` // Temporary ID for offline mode
                    }
                }
            });
            return result.data?.createLoggableEvent || null;
        } catch (error) {
            console.error('Error creating loggable event:', error);
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    const updateLoggableEvent = async (
        id: string,
        input: Omit<UpdateLoggableEventInput, 'id'>
    ): Promise<LoggableEvent | null> => {
        try {
            const result = await updateLoggableEventMutation({
                variables: { input: { id, ...input } }
            });
            return result.data?.updateLoggableEvent || null;
        } catch (error) {
            console.error('Error updating loggable event:', error);
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    const deleteLoggableEvent = async (id: string): Promise<boolean> => {
        try {
            await deleteLoggableEventMutation({
                variables: { input: { id } }
            });
            return true;
        } catch (error) {
            console.error('Error deleting loggable event:', error);
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return true;
        }
    };

    const addTimestampToEvent = async (eventId: string, timestamp: Date): Promise<LoggableEvent | null> => {
        try {
            const result = await addTimestampMutation({
                variables: {
                    input: {
                        eventId,
                        timestamp: timestamp.toISOString()
                    }
                }
            });
            return result.data?.addTimestampToEvent || null;
        } catch (error) {
            console.error('Error adding timestamp to event:', error);
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    const removeTimestampFromEvent = async (eventId: string, timestamp: Date): Promise<LoggableEvent | null> => {
        try {
            const result = await removeTimestampMutation({
                variables: {
                    input: {
                        eventId,
                        timestamp: timestamp.toISOString()
                    }
                }
            });
            return result.data?.removeTimestampFromEvent || null;
        } catch (error) {
            console.error('Error removing timestamp from event:', error);
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    return {
        createLoggableEvent,
        updateLoggableEvent,
        deleteLoggableEvent,
        addTimestampToEvent,
        removeTimestampFromEvent,
        createIsLoading,
        updateIsLoading,
        deleteIsLoading,
        addTimestampIsLoading,
        removeTimestampIsLoading,
        loading:
            createIsLoading || updateIsLoading || deleteIsLoading || addTimestampIsLoading || removeTimestampIsLoading
    };
};
