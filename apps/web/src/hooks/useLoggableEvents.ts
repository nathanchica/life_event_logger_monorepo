import { gql, useMutation, Reference, useApolloClient, ApolloError } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../providers/AuthProvider';
import { LoggableEvent, LoggableEventFragment, GenericApiError } from '../utils/types';

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
    id: string;
    timestamp: string; // ISO string
}

export interface RemoveTimestampInput {
    id: string;
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
    fragment CreateLoggableEventPayloadFragment on CreateLoggableEventMutationPayload {
        tempID
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
    ${GENERIC_API_ERROR_FRAGMENT}
`;

export const CREATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation CreateLoggableEvent($input: CreateLoggableEventMutationInput!) {
        createLoggableEvent(input: $input) {
            ...CreateLoggableEventPayloadFragment
        }
    }
    ${CREATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const UPDATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT = gql`
    fragment UpdateLoggableEventPayloadFragment on UpdateLoggableEventMutationPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
    ${GENERIC_API_ERROR_FRAGMENT}
`;

export const UPDATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation UpdateLoggableEvent($input: UpdateLoggableEventMutationInput!) {
        updateLoggableEvent(input: $input) {
            ...UpdateLoggableEventPayloadFragment
        }
    }
    ${UPDATE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const DELETE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT = gql`
    fragment DeleteLoggableEventPayloadFragment on DeleteLoggableEventMutationPayload {
        loggableEvent {
            id
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${GENERIC_API_ERROR_FRAGMENT}
`;

export const DELETE_LOGGABLE_EVENT_MUTATION = gql`
    mutation DeleteLoggableEvent($input: DeleteLoggableEventMutationInput!) {
        deleteLoggableEvent(input: $input) {
            ...DeleteLoggableEventPayloadFragment
        }
    }
    ${DELETE_LOGGABLE_EVENT_PAYLOAD_FRAGMENT}
`;

export const ADD_TIMESTAMP_PAYLOAD_FRAGMENT = gql`
    fragment AddTimestampPayloadFragment on AddTimestampToEventMutationPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
    ${GENERIC_API_ERROR_FRAGMENT}
`;

export const ADD_TIMESTAMP_TO_EVENT_MUTATION = gql`
    mutation AddTimestampToEvent($input: AddTimestampToEventMutationInput!) {
        addTimestampToEvent(input: $input) {
            ...AddTimestampPayloadFragment
        }
    }
    ${ADD_TIMESTAMP_PAYLOAD_FRAGMENT}
`;

export const REMOVE_TIMESTAMP_PAYLOAD_FRAGMENT = gql`
    fragment RemoveTimestampPayloadFragment on RemoveTimestampFromEventMutationPayload {
        loggableEvent {
            ...UseLoggableEventsFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${USE_LOGGABLE_EVENTS_FRAGMENT}
    ${GENERIC_API_ERROR_FRAGMENT}
`;

export const REMOVE_TIMESTAMP_FROM_EVENT_MUTATION = gql`
    mutation RemoveTimestampFromEvent($input: RemoveTimestampFromEventMutationInput!) {
        removeTimestampFromEvent(input: $input) {
            ...RemoveTimestampPayloadFragment
        }
    }
    ${REMOVE_TIMESTAMP_PAYLOAD_FRAGMENT}
`;

export const GET_EVENT_LABELS_FOR_USER = gql`
    query GetEventLabelsForUser {
        loggedInUser {
            id
            eventLabels {
                id
                name
            }
        }
    }
`;

/**
 * Hook for managing loggable events with Apollo mutations.
 * Provides create, update, delete, and timestamp operations with optimistic updates.
 */
export const useLoggableEvents = () => {
    const { user } = useAuth();
    const client = useApolloClient();

    const getAllUserEventLabels = () => {
        const data = client.readQuery({
            query: GET_EVENT_LABELS_FOR_USER
        });
        return data?.loggedInUser?.eventLabels || [];
    };

    const getEventFromCache = (id: string): LoggableEventFragment | null =>
        client.cache.readFragment({
            id: client.cache.identify({ __typename: 'LoggableEvent', id }),
            fragment: USE_LOGGABLE_EVENTS_FRAGMENT
        });

    const [createLoggableEventMutation, { loading: createIsLoading }] = useMutation(CREATE_LOGGABLE_EVENT_MUTATION, {
        optimisticResponse: (variables) => {
            const inputLabelIds = new Set(variables.input.labelIds || []);
            const labels = [...getAllUserEventLabels()].filter(({ id }) => inputLabelIds.has(id));
            const tempID = variables.input.id;

            return {
                createLoggableEvent: {
                    __typename: 'CreateLoggableEventMutationPayload',
                    tempID,
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: tempID,
                        name: variables.input.name,
                        timestamps: [],
                        warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                        labels
                    },
                    errors: []
                }
            };
        },
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

                        return [newEventRef, ...existingEventRefs];
                    }
                }
            });
        }
    });

    const [updateLoggableEventMutation, { loading: updateIsLoading }] = useMutation(UPDATE_LOGGABLE_EVENT_MUTATION, {
        // using any type here. it will be fixed in apollo 4.0 (not yet out at this time) https://github.com/apollographql/apollo-client/issues/12726
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optimisticResponse: (variables, { IGNORE }: { IGNORE: any }) => {
            const existingEvent: LoggableEventFragment | null = getEventFromCache(variables.input.id);

            if (!existingEvent) return IGNORE;

            const inputLabelIds = new Set(variables.input.labelIds || []);
            const labels = [...getAllUserEventLabels()].filter(({ id }) => inputLabelIds.has(id));

            return {
                updateLoggableEvent: {
                    __typename: 'UpdateLoggableEventMutationPayload',
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: variables.input.id,
                        name: variables.input.name,
                        timestamps: existingEvent.timestamps,
                        warningThresholdInDays:
                            variables.input.warningThresholdInDays || existingEvent.warningThresholdInDays,
                        labels
                    },
                    errors: []
                }
            };
        }
    });

    const [deleteLoggableEventMutation, { loading: deleteIsLoading }] = useMutation(DELETE_LOGGABLE_EVENT_MUTATION, {
        // using any type here. it will be fixed in apollo 4.0 (not yet out at this time) https://github.com/apollographql/apollo-client/issues/12726
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optimisticResponse: (variables, { IGNORE }: { IGNORE: any }) => {
            const existingEvent: LoggableEventFragment | null = getEventFromCache(variables.input.id);

            if (!existingEvent) return IGNORE;

            return {
                deleteLoggableEvent: {
                    __typename: 'DeleteLoggableEventMutationPayload',
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: variables.input.id,
                        name: existingEvent.name,
                        warningThresholdInDays: existingEvent.warningThresholdInDays,
                        labels: existingEvent.labels,
                        timestamps: existingEvent.timestamps
                    },
                    errors: []
                }
            };
        },
        update: (cache, { data }) => {
            if (!data?.deleteLoggableEvent || !data.deleteLoggableEvent?.loggableEvent || !user?.id) return;

            const eventId = data.deleteLoggableEvent.loggableEvent.id;

            // Remove event from user's loggableEvents list first
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existingEventRefs, { readField }) {
                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing events, return empty array
                        // istanbul ignore next
                        if (!existingEventRefs) return [];

                        return existingEventRefs.filter((eventRef: Reference) => readField('id', eventRef) !== eventId);
                    }
                }
            });

            // Remove the event from the cache
            cache.evict({
                id: cache.identify({ __typename: 'LoggableEvent', id: eventId })
            });
        }
    });

    const [addTimestampMutation, { loading: addTimestampIsLoading }] = useMutation(ADD_TIMESTAMP_TO_EVENT_MUTATION, {
        // using any type here. it will be fixed in apollo 4.0 (not yet out at this time) https://github.com/apollographql/apollo-client/issues/12726
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optimisticResponse: (variables, { IGNORE }: { IGNORE: any }) => {
            const existingEvent: LoggableEventFragment | null = getEventFromCache(variables.input.id);

            if (!existingEvent) return IGNORE;

            const updatedTimestamps = Array.from(new Set([...existingEvent.timestamps, variables.input.timestamp]));

            return {
                addTimestampToEvent: {
                    __typename: 'AddTimestampToEventMutationPayload',
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: variables.input.id,
                        timestamps: updatedTimestamps,
                        name: existingEvent.name,
                        warningThresholdInDays: existingEvent.warningThresholdInDays,
                        labels: existingEvent.labels
                    },
                    errors: []
                }
            };
        }
    });

    const [removeTimestampMutation, { loading: removeTimestampIsLoading }] = useMutation(
        REMOVE_TIMESTAMP_FROM_EVENT_MUTATION,
        {
            // using any type here. it will be fixed in apollo 4.0 (not yet out at this time) https://github.com/apollographql/apollo-client/issues/12726
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            optimisticResponse: (variables, { IGNORE }: { IGNORE: any }) => {
                const existingEvent: LoggableEventFragment | null = getEventFromCache(variables.input.id);

                if (!existingEvent) return IGNORE;

                const updatedTimestamps = existingEvent.timestamps.filter(
                    (timestamp: string) => timestamp !== variables.input.timestamp
                );

                return {
                    removeTimestampFromEvent: {
                        __typename: 'RemoveTimestampFromEventMutationPayload',
                        loggableEvent: {
                            __typename: 'LoggableEvent',
                            id: variables.input.id,
                            timestamps: updatedTimestamps,
                            name: existingEvent.name,
                            warningThresholdInDays: existingEvent.warningThresholdInDays,
                            labels: existingEvent.labels
                        },
                        errors: []
                    }
                };
            }
        }
    );

    /**
     * WRAPPER FUNCTIONS
     */

    /**
     * Create a new loggable event
     */
    const createLoggableEvent = ({
        input,
        onCompleted,
        onError
    }: {
        input: Omit<CreateLoggableEventInput, 'id'>;
        onCompleted?: (payload: { createLoggableEvent: CreateLoggableEventPayload }) => void;
        onError?: (error: ApolloError) => void;
    }): void => {
        createLoggableEventMutation({
            variables: {
                input: {
                    ...input,
                    id: `temp-${uuidv4()}` // Temporary ID for optimistic update
                }
            },
            onCompleted,
            onError
        });
    };

    /**
     * Update an existing loggable event
     */
    const updateLoggableEvent = ({
        input,
        onCompleted,
        onError
    }: {
        input: UpdateLoggableEventInput;
        onCompleted?: (payload: { updateLoggableEvent: UpdateLoggableEventPayload }) => void;
        onError?: (error: ApolloError) => void;
    }): void => {
        updateLoggableEventMutation({
            variables: { input },
            onCompleted,
            onError
        });
    };

    /**
     * Delete an existing loggable event
     */
    const deleteLoggableEvent = ({
        input,
        onCompleted,
        onError
    }: {
        input: DeleteLoggableEventInput;
        onCompleted?: (payload: { deleteLoggableEvent: DeleteLoggableEventPayload }) => void;
        onError?: (error: ApolloError) => void;
    }): void => {
        deleteLoggableEventMutation({
            variables: { input },
            onCompleted,
            onError
        });
    };

    /**
     * Add a timestamp to an event
     */
    const addTimestampToEvent = ({
        input,
        onCompleted,
        onError
    }: {
        input: AddTimestampInput;
        onCompleted?: (payload: { addTimestampToEvent: AddTimestampPayload }) => void;
        onError?: (error: ApolloError) => void;
    }): void => {
        addTimestampMutation({
            variables: { input },
            onCompleted,
            onError
        });
    };

    /**
     * Remove a timestamp from an event
     */
    const removeTimestampFromEvent = ({
        input,
        onCompleted,
        onError
    }: {
        input: RemoveTimestampInput;
        onCompleted?: (payload: { removeTimestampFromEvent: RemoveTimestampPayload }) => void;
        onError?: (error: ApolloError) => void;
    }): void => {
        removeTimestampMutation({
            variables: { input },
            onCompleted,
            onError
        });
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
