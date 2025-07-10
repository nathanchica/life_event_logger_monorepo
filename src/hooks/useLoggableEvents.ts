import { gql, useMutation, Reference } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../providers/AuthProvider';
import { LoggableEvent, GenericApiError } from '../utils/types';

/**
 * Mutation input types
 */
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

/**
 * Mutation payload types
 */
export type CreateLoggableEventPayload = {
    loggableEvent: LoggableEvent;
    errors: Array<GenericApiError>;
};

export type UpdateLoggableEventPayload = {
    loggableEvent: LoggableEvent;
    errors: Array<GenericApiError>;
};

export type DeleteLoggableEventPayload = {
    loggableEvent: LoggableEvent;
    errors: Array<GenericApiError>;
};

export type AddTimestampPayload = {
    loggableEvent: LoggableEvent;
    errors: Array<GenericApiError>;
};

export type RemoveTimestampPayload = {
    loggableEvent: LoggableEvent;
    errors: Array<GenericApiError>;
};

/**
 * GraphQL fragments and mutations for loggable events
 */
export const USE_LOGGABLE_EVENTS_FRAGMENT = gql`
    fragment UseLoggableEventsFragment on LoggableEvent {
        id
        name
        timestamps
        warningThresholdInDays
        labels {
            id
            name
        }
    }
`;

export const GENERIC_API_ERROR_FRAGMENT = gql`
    fragment GenericApiErrorFragment on GenericApiError {
        code
        field
        message
    }
`;

export const CREATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT = gql`
    fragment CreateLoggableEventPayloadFragment on CreateLoggableEventPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
`;

export const CREATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation CreateLoggableEvent($input: CreateLoggableEventInput!) {
        createLoggableEvent(input: $input) {
            ...CreateLoggableEventPayloadFragment
        }
    }
    ${CREATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const UPDATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT = gql`
    fragment UpdateLoggableEventPayloadFragment on UpdateLoggableEventPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
`;

export const UPDATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation UpdateLoggableEvent($input: UpdateLoggableEventInput!) {
        updateLoggableEvent(input: $input) {
            ...UpdateLoggableEventPayloadFragment
        }
    }
    ${UPDATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const DELETE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT = gql`
    fragment DeleteLoggableEventPayloadFragment on DeleteLoggableEventPayload {
        loggableEvent {
            id
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
`;

export const DELETE_LOGGABLE_EVENT_MUTATION = gql`
    mutation DeleteLoggableEvent($input: DeleteLoggableEventInput!) {
        deleteLoggableEvent(input: $input) {
            ...DeleteLoggableEventPayloadFragment
        }
    }
    ${DELETE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const ADD_TIMESTAMP_PAYLOAD_FRAGMENT = gql`
    fragment AddTimestampPayloadFragment on AddTimestampPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
`;

export const ADD_TIMESTAMP_TO_EVENT_MUTATION = gql`
    mutation AddTimestampToEvent($input: AddTimestampInput!) {
        addTimestampToEvent(input: $input) {
            ...AddTimestampPayloadFragment
        }
    }
    ${ADD_TIMESTAMP_PAYLOAD_FRAGMENT}
`;

export const REMOVE_TIMESTAMP_PAYLOAD_FRAGMENT = gql`
    fragment RemoveTimestampPayloadFragment on RemoveTimestampPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
`;

export const REMOVE_TIMESTAMP_FROM_EVENT_MUTATION = gql`
    mutation RemoveTimestampFromEvent($input: RemoveTimestampInput!) {
        removeTimestampFromEvent(input: $input) {
            ...RemoveTimestampPayloadFragment
        }
    }
    ${REMOVE_TIMESTAMP_PAYLOAD_FRAGMENT}
`;

/**
 * Hook for managing loggable events with Apollo mutations.
 * Provides create, update, delete, and timestamp operations with optimistic updates.
 */
export const useLoggableEvents = () => {
    const { user } = useAuth();

    const [createLoggableEventMutation, { loading: createIsLoading }] = useMutation(CREATE_LOGGABLE_EVENT_MUTATION, {
        optimisticResponse: (variables) => ({
            createLoggableEvent: {
                __typename: 'CreateLoggableEventPayload',
                loggableEvent: {
                    __typename: 'LoggableEvent',
                    id: `temp-${uuidv4()}`,
                    name: variables.input.name,
                    timestamps: [],
                    warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                    labels: []
                },
                errors: []
            }
        }),
        update: (cache, { data }) => {
            if (!data?.createLoggableEvent || !data.createLoggableEvent?.loggableEvent || !user?.id) return;

            // Add new event to user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existingEventRefs, { readField }) {
                        const newEventRef = cache.writeFragment({
                            fragment: USE_LOGGABLE_EVENTS_FRAGMENT,
                            data: data.createLoggableEvent.loggableEvent
                        });

                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing events, return new event as the only ref
                        // istanbul ignore next
                        if (!existingEventRefs) return [newEventRef];

                        // If newEventRef is null, return existing refs
                        // istanbul ignore next
                        if (!newEventRef) return existingEventRefs;

                        // If event already exists, return existing refs
                        // istanbul ignore next
                        if (
                            existingEventRefs.some(
                                (ref: Reference) => readField('id', ref) === data.createLoggableEvent.loggableEvent.id
                            )
                        ) {
                            return existingEventRefs;
                        }

                        return [...existingEventRefs, newEventRef];
                    }
                }
            });
        }
    });

    const [updateLoggableEventMutation, { loading: updateIsLoading }] = useMutation(UPDATE_LOGGABLE_EVENT_MUTATION, {
        optimisticResponse: (variables) => ({
            updateLoggableEvent: {
                __typename: 'UpdateLoggableEventPayload',
                loggableEvent: {
                    __typename: 'LoggableEvent',
                    id: variables.input.id,
                    name: variables.input.name,
                    timestamps: [],
                    warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                    labels: []
                },
                errors: []
            }
        })
    });

    const [deleteLoggableEventMutation, { loading: deleteIsLoading }] = useMutation(DELETE_LOGGABLE_EVENT_MUTATION, {
        optimisticResponse: (variables) => ({
            deleteLoggableEvent: {
                __typename: 'DeleteLoggableEventPayload',
                loggableEvent: {
                    __typename: 'LoggableEvent',
                    id: variables.input.id
                },
                errors: []
            }
        }),
        update: (cache, { data }) => {
            if (!data?.deleteLoggableEvent || !data.deleteLoggableEvent?.loggableEvent || !user?.id) return;

            // Remove event from user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existingEventRefs, { readField }) {
                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing events, return empty array
                        // istanbul ignore next
                        if (!existingEventRefs) return [];

                        return existingEventRefs.filter(
                            (eventRef: Reference) =>
                                readField('id', eventRef) !== data.deleteLoggableEvent.loggableEvent.id
                        );
                    }
                }
            });

            // Remove the event from cache completely
            cache.evict({
                id: cache.identify({ __typename: 'LoggableEvent', id: data.deleteLoggableEvent.loggableEvent.id })
            });
        }
    });

    const [addTimestampMutation, { loading: addTimestampIsLoading }] = useMutation(ADD_TIMESTAMP_TO_EVENT_MUTATION, {
        optimisticResponse: (variables) => ({
            addTimestampToEvent: {
                __typename: 'AddTimestampPayload',
                loggableEvent: {
                    __typename: 'LoggableEvent',
                    id: variables.input.eventId,
                    // We can't easily get the current timestamps here, but Apollo will merge this
                    timestamps: [variables.input.timestamp],
                    name: '',
                    warningThresholdInDays: 0,
                    labels: []
                },
                errors: []
            }
        })
    });

    const [removeTimestampMutation, { loading: removeTimestampIsLoading }] = useMutation(
        REMOVE_TIMESTAMP_FROM_EVENT_MUTATION
    );

    /**
     * WRAPPER FUNCTIONS
     */

    /**
     * Create a new loggable event
     */
    const createLoggableEvent = async (
        input: Omit<CreateLoggableEventInput, 'id'>
    ): Promise<CreateLoggableEventPayload | null> => {
        try {
            const result = await createLoggableEventMutation({
                variables: {
                    input: {
                        ...input,
                        id: `temp-${uuidv4()}` // Temporary ID for offline mode
                    }
                }
            });
            return result.data?.createLoggableEvent || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Update an existing loggable event
     */
    const updateLoggableEvent = async (input: UpdateLoggableEventInput): Promise<UpdateLoggableEventPayload | null> => {
        try {
            const result = await updateLoggableEventMutation({
                variables: { input }
            });
            return result.data?.updateLoggableEvent || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Delete an existing loggable event
     */
    const deleteLoggableEvent = async (input: DeleteLoggableEventInput): Promise<DeleteLoggableEventPayload | null> => {
        try {
            const { data } = await deleteLoggableEventMutation({
                variables: { input }
            });
            return data?.deleteLoggableEvent || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Add a timestamp to an event
     */
    const addTimestampToEvent = async (input: AddTimestampInput): Promise<AddTimestampPayload | null> => {
        try {
            const result = await addTimestampMutation({
                variables: { input }
            });
            return result.data?.addTimestampToEvent || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Remove a timestamp from an event
     */
    const removeTimestampFromEvent = async (input: RemoveTimestampInput): Promise<RemoveTimestampPayload | null> => {
        try {
            const result = await removeTimestampMutation({
                variables: { input }
            });
            return result.data?.removeTimestampFromEvent || null;
        } catch {
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
