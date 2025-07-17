import { gql, useMutation, Reference, useApolloClient } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { readEventLabelFromCache } from '../apollo/client';
import { useAuth } from '../providers/AuthProvider';
import { LoggableEvent, LoggableEventFragment, GenericApiError, EventLabelFragment } from '../utils/types';

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

/**
 * Helper function to resolve label IDs to label objects from cache
 * @param labelIds - Array of label IDs to resolve, or undefined
 * @param fallbackLabels - Default labels to use if labelIds is not provided
 * @returns Array of EventLabelFragment objects
 */
const resolveLabelsFromCache = (
    labelIds: string[] | undefined,
    fallbackLabels: EventLabelFragment[] = []
): EventLabelFragment[] => {
    if (!labelIds) {
        return fallbackLabels;
    }

    const resolvedLabels = labelIds
        .map((id: string) => readEventLabelFromCache(id))
        .filter(Boolean) as EventLabelFragment[];

    // If some labels couldn't be resolved from cache, merge with fallback labels
    // This ensures optimistic updates work even when labels aren't in cache yet
    if (resolvedLabels.length < labelIds.length) {
        const resolvedLabelIds = new Set(resolvedLabels.map((label) => label.id));
        const missingLabelIds = labelIds.filter((id) => !resolvedLabelIds.has(id));

        // Try to find missing labels in fallback labels
        const missingLabelsFromFallback = fallbackLabels.filter((label) => missingLabelIds.includes(label.id));

        return [...resolvedLabels, ...missingLabelsFromFallback];
    }

    return resolvedLabels;
};

/**
 * Hook for managing loggable events with Apollo mutations.
 * Provides create, update, delete, and timestamp operations with optimistic updates.
 */
export const useLoggableEvents = () => {
    const { user } = useAuth();
    const client = useApolloClient();

    const [createLoggableEventMutation, { loading: createIsLoading }] = useMutation(CREATE_LOGGABLE_EVENT_MUTATION, {
        optimisticResponse: (variables) => {
            const labels = resolveLabelsFromCache(variables.input.labelIds);
            // Use the tempID passed in variables instead of generating a new one
            const tempId = variables.input.id || `temp-${uuidv4()}`;

            return {
                createLoggableEvent: {
                    __typename: 'CreateLoggableEventMutationPayload',
                    tempID: tempId,
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: tempId,
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

            const tempID = data.createLoggableEvent.tempID;
            const realEvent = data.createLoggableEvent.loggableEvent;

            // If we have a tempID that matches an existing temp event, we need to replace it
            if (tempID && tempID.startsWith('temp-')) {
                // Update the user's loggableEvents list
                cache.modify({
                    id: cache.identify({ __typename: 'User', id: user.id }),
                    fields: {
                        loggableEvents(existingEventRefs, { readField }) {
                            // Safety checks. Not practically reachable so ignore them in coverage
                            // istanbul ignore next
                            if (!existingEventRefs) {
                                const newEventRef = cache.writeFragment({
                                    fragment: USE_LOGGABLE_EVENTS_FRAGMENT,
                                    data: realEvent
                                });
                                return [newEventRef];
                            }

                            // Check if we have a temp event to replace
                            const tempEventIndex = existingEventRefs.findIndex(
                                (ref: Reference) => readField('id', ref) === tempID
                            );

                            if (tempEventIndex !== -1) {
                                // Replace the temp event with the real one
                                const newRefs = [...existingEventRefs];
                                const newEventRef = cache.writeFragment({
                                    fragment: USE_LOGGABLE_EVENTS_FRAGMENT,
                                    data: realEvent
                                });

                                // istanbul ignore next
                                if (!newEventRef) return existingEventRefs;

                                newRefs[tempEventIndex] = newEventRef;

                                // Remove the temp event from cache after replacing the reference
                                cache.evict({ id: cache.identify({ __typename: 'LoggableEvent', id: tempID }) });

                                return newRefs;
                            } else {
                                // No temp event found, check if real event already exists
                                // istanbul ignore next
                                if (existingEventRefs.some((ref: Reference) => readField('id', ref) === realEvent.id)) {
                                    return existingEventRefs;
                                }

                                // Add as new event
                                const newEventRef = cache.writeFragment({
                                    fragment: USE_LOGGABLE_EVENTS_FRAGMENT,
                                    data: realEvent
                                });

                                // istanbul ignore next
                                if (!newEventRef) return existingEventRefs;

                                return [...existingEventRefs, newEventRef];
                            }
                        }
                    }
                });
            } else {
                // No tempID - standard behavior
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
                                    (ref: Reference) =>
                                        readField('id', ref) === data.createLoggableEvent.loggableEvent.id
                                )
                            ) {
                                return existingEventRefs;
                            }

                            return [...existingEventRefs, newEventRef];
                        }
                    }
                });
            }
        }
    });

    const [updateLoggableEventMutation, { loading: updateIsLoading }] = useMutation(UPDATE_LOGGABLE_EVENT_MUTATION, {
        // using any type here. it will be fixed in apollo 4.0 (not yet out at this time) https://github.com/apollographql/apollo-client/issues/12726
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optimisticResponse: (variables, { IGNORE }: { IGNORE: any }) => {
            const eventId = client.cache.identify({ __typename: 'LoggableEvent', id: variables.input.id });

            if (!eventId) return IGNORE;

            const existingEvent: LoggableEventFragment | null = client.cache.readFragment({
                id: eventId,
                fragment: USE_LOGGABLE_EVENTS_FRAGMENT
            });

            if (!existingEvent) return IGNORE;

            const labels = resolveLabelsFromCache(variables.input.labelIds, existingEvent.labels);

            return {
                updateLoggableEvent: {
                    __typename: 'UpdateLoggableEventMutationPayload',
                    loggableEvent: {
                        __typename: 'LoggableEvent',
                        id: variables.input.id,
                        name: variables.input.name,
                        timestamps: existingEvent.timestamps,
                        warningThresholdInDays: variables.input.warningThresholdInDays,
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
            const eventId = client.cache.identify({ __typename: 'LoggableEvent', id: variables.input.id });

            if (!eventId) return IGNORE;

            const existingEvent: LoggableEventFragment | null = client.cache.readFragment({
                id: eventId,
                fragment: USE_LOGGABLE_EVENTS_FRAGMENT
            });

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
            const eventId = client.cache.identify({ __typename: 'LoggableEvent', id: variables.input.id });

            if (!eventId) return IGNORE;

            const existingEvent: LoggableEventFragment | null = client.cache.readFragment({
                id: eventId,
                fragment: USE_LOGGABLE_EVENTS_FRAGMENT
            });

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
                const eventId = client.cache.identify({ __typename: 'LoggableEvent', id: variables.input.id });

                if (!eventId) return IGNORE;

                const existingEvent: LoggableEventFragment | null = client.cache.readFragment({
                    id: eventId,
                    fragment: USE_LOGGABLE_EVENTS_FRAGMENT
                });

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
    const createLoggableEvent = (input: Omit<CreateLoggableEventInput, 'id'>): void => {
        try {
            createLoggableEventMutation({
                variables: {
                    input: {
                        ...input,
                        id: `temp-${uuidv4()}` // Temporary ID for optimistic update
                    }
                }
            });
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return;
        }
    };

    /**
     * Update an existing loggable event
     */
    const updateLoggableEvent = (input: UpdateLoggableEventInput): void => {
        try {
            updateLoggableEventMutation({
                variables: { input }
            });
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return;
        }
    };

    /**
     * Delete an existing loggable event
     */
    const deleteLoggableEvent = (input: DeleteLoggableEventInput): void => {
        try {
            deleteLoggableEventMutation({
                variables: { input }
            });
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return;
        }
    };

    /**
     * Add a timestamp to an event
     */
    const addTimestampToEvent = (input: AddTimestampInput): void => {
        try {
            addTimestampMutation({
                variables: { input }
            });
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return;
        }
    };

    /**
     * Remove a timestamp from an event
     */
    const removeTimestampFromEvent = (input: RemoveTimestampInput): void => {
        try {
            removeTimestampMutation({
                variables: { input }
            });
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return;
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
