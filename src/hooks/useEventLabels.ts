import { gql, useMutation, Reference } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../providers/AuthProvider';
import { EventLabelFragment, GenericApiError } from '../utils/types';

/**
 * Mutation input types
 */
export interface CreateEventLabelInput {
    name: string;
}

export interface UpdateEventLabelInput {
    id: string;
    name: string;
}

export interface DeleteEventLabelInput {
    id: string;
}

/**
 * Mutation payload types
 */

export type CreateEventLabelPayload = {
    eventLabel: EventLabelFragment;
    errors: Array<GenericApiError>;
};

export type UpdateEventLabelPayload = {
    eventLabel: EventLabelFragment;
    errors: Array<GenericApiError>;
};

export type DeleteEventLabelPayload = {
    eventLabel: EventLabelFragment;
    errors: Array<GenericApiError>;
};

/**
 * GraphQL fragments and mutations for event labels
 */

export const EVENT_LABEL_FRAGMENT = gql`
    fragment EventLabelFragment on EventLabel {
        id
        name
    }
`;

export const GENERIC_API_ERROR_FRAGMENT = gql`
    fragment GenericApiErrorFragment on GenericApiError {
        code
        field
        message
    }
`;

export const CREATE_EVENT_LABEL_PAYLOAD_FRAGMENT = gql`
    fragment CreateEventLabelPayloadFragment on CreateEventLabelPayload {
        eventLabel {
            ...EventLabelFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${EVENT_LABEL_FRAGMENT}
`;

export const CREATE_EVENT_LABEL_MUTATION = gql`
    mutation CreateEventLabel($input: CreateEventLabelInput!) {
        createEventLabel(input: $input) {
            ...CreateEventLabelPayloadFragment
        }
    }
    ${CREATE_EVENT_LABEL_PAYLOAD_FRAGMENT}
`;

export const UPDATE_EVENT_LABEL_PAYLOAD_FRAGMENT = gql`
    fragment UpdateEventLabelPayloadFragment on UpdateEventLabelPayload {
        eventLabel {
            ...EventLabelFragment
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
    ${EVENT_LABEL_FRAGMENT}
`;

export const UPDATE_EVENT_LABEL_MUTATION = gql`
    mutation UpdateEventLabel($input: UpdateEventLabelInput!) {
        updateEventLabel(input: $input) {
            ...UpdateEventLabelPayloadFragment
        }
    }
    ${UPDATE_EVENT_LABEL_PAYLOAD_FRAGMENT}
`;

export const DELETE_EVENT_LABEL_PAYLOAD_FRAGMENT = gql`
    fragment DeleteEventLabelPayloadFragment on DeleteEventLabelPayload {
        eventLabel {
            id
        }
        errors {
            ...GenericApiErrorFragment
        }
    }
`;

export const DELETE_EVENT_LABEL_MUTATION = gql`
    mutation DeleteEventLabel($input: DeleteEventLabelInput!) {
        deleteEventLabel(input: $input) {
            ...DeleteEventLabelPayloadFragment
        }
    }
    ${DELETE_EVENT_LABEL_PAYLOAD_FRAGMENT}
`;

/**
 * Hook for managing event labels with Apollo mutations.
 * Provides create, update, and delete operations with optimistic updates.
 */
export const useEventLabels = () => {
    const { user } = useAuth();

    const [createEventLabelMutation, { loading: createIsLoading }] = useMutation(CREATE_EVENT_LABEL_MUTATION, {
        optimisticResponse: (variables) => ({
            createEventLabel: {
                __typename: 'EventLabel',
                id: `temp-${uuidv4()}`,
                name: variables.input.name
            }
        }),
        update: (cache, { data }) => {
            if (!data?.createEventLabel || !data.createEventLabel?.eventLabel || !user?.id) return;

            // Add new label to user's eventLabels list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    eventLabels(existingLabelRefs, { readField }) {
                        const newLabelRef = cache.writeFragment({
                            fragment: EVENT_LABEL_FRAGMENT,
                            data: data.createEventLabel.eventLabel
                        });

                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing labels, return new label as the only ref
                        // istanbul ignore next
                        if (!existingLabelRefs) return [newLabelRef];

                        // If newLabelRef is null, return existing refs
                        // istanbul ignore next
                        if (!newLabelRef) return existingLabelRefs;

                        // If label already exists, return existing refs
                        // istanbul ignore next
                        if (
                            existingLabelRefs.some(
                                (ref: Reference) => readField('id', ref) === data.createEventLabel.eventLabel.id
                            )
                        ) {
                            return existingLabelRefs;
                        }

                        return [...existingLabelRefs, newLabelRef];
                    }
                }
            });
        }
    });

    const [updateEventLabelMutation, { loading: updateIsLoading }] = useMutation(UPDATE_EVENT_LABEL_MUTATION, {
        optimisticResponse: (variables) => ({
            updateEventLabel: {
                __typename: 'EventLabel',
                id: variables.input.id,
                name: variables.input.name
            }
        })
    });

    const [deleteEventLabelMutation, { loading: deleteIsLoading }] = useMutation(DELETE_EVENT_LABEL_MUTATION, {
        optimisticResponse: (variables) => ({
            deleteEventLabel: {
                __typename: 'DeleteEventLabelPayload',
                eventLabel: {
                    __typename: 'EventLabel',
                    id: variables.input.id
                },
                errors: []
            }
        }),
        update: (cache, { data }) => {
            if (!data?.deleteEventLabel || !data.deleteEventLabel?.eventLabel || !user?.id) return;

            // Remove label from user's eventLabels list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    eventLabels(existingLabelRefs, { readField }) {
                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing labels, return empty array
                        // istanbul ignore next
                        if (!existingLabelRefs) return [];

                        return existingLabelRefs.filter(
                            (labelRef: Reference) => readField('id', labelRef) !== data.deleteEventLabel.eventLabel.id
                        );
                    },
                    loggableEvents(existingLoggableEventsRefs, { readField }) {
                        // Safety checks. Not practically reachable so ignore them in coverage

                        // If no existing loggable events, return empty array
                        // istanbul ignore next
                        if (!existingLoggableEventsRefs) return [];

                        // Remove label from all loggable events that had it
                        existingLoggableEventsRefs.forEach((loggableEventRef: Reference) => {
                            const labels = (readField('labels', loggableEventRef) as Reference[]) || [];
                            const updatedLabels = labels.filter(
                                (labelRef: Reference) =>
                                    readField('id', labelRef) !== data.deleteEventLabel.eventLabel.id
                            );

                            // Only update if the event actually had this label
                            if (labels.length !== updatedLabels.length) {
                                cache.writeFragment({
                                    id: cache.identify(loggableEventRef),
                                    fragment: gql`
                                        fragment UpdatedLoggableEvent on LoggableEvent {
                                            labels
                                        }
                                    `,
                                    data: { labels: updatedLabels }
                                });
                            }
                        });

                        // Return the original array since we've updated the individual objects
                        return existingLoggableEventsRefs;
                    }
                }
            });

            // Remove the label from cache completely
            cache.evict({ id: cache.identify({ __typename: 'EventLabel', id: data.deleteEventLabel.id }) });
        }
    });

    /**
     * WRAPPER FUNCTIONS
     */

    /**
     * Create a new event label
     */
    const createEventLabel = async (
        input: Omit<CreateEventLabelInput, 'id'>
    ): Promise<CreateEventLabelPayload | null> => {
        try {
            const result = await createEventLabelMutation({
                variables: {
                    input: {
                        ...input,
                        id: `temp-${uuidv4()}` // Temporary ID for offline mode
                    }
                }
            });
            return result.data?.createEventLabel || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Update an existing event label
     */
    const updateEventLabel = async (input: UpdateEventLabelInput): Promise<UpdateEventLabelPayload | null> => {
        try {
            const result = await updateEventLabelMutation({
                variables: { input }
            });
            return result.data?.updateEventLabel || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    /**
     * Delete an existing event label
     */
    const deleteEventLabel = async (input: DeleteEventLabelInput): Promise<DeleteEventLabelPayload | null> => {
        try {
            const { data } = await deleteEventLabelMutation({
                variables: { input }
            });
            return data?.deleteEventLabel || null;
        } catch {
            // Don't throw the error - this allows the optimistic update to persist
            // even when the network request fails
            return null;
        }
    };

    return {
        createEventLabel,
        updateEventLabel,
        deleteEventLabel,
        createIsLoading,
        updateIsLoading,
        deleteIsLoading,
        loading: createIsLoading || updateIsLoading || deleteIsLoading
    };
};
