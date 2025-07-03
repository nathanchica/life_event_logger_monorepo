import { gql, useQuery, useMutation } from '@apollo/client';

export const GET_USERS_EVENTS_AND_LABELS_QUERY = gql`
    query GetUsersEventsAndLabels($userId: String!) {
        user(userId: $userId) {
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
            eventLabels {
                id
                name
            }
        }
    }
`;

export const CREATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation CreateLoggableEvent($input: CreateLoggableEventInput!) {
        createLoggableEvent(input: $input) {
            id
        }
    }
`;

export const CREATE_EVENT_RECORD_MUTATION = gql`
    mutation CreateEventRecord($input: CreateEventRecordMutation!) {
        createTimestampForEvent(input: $input) {
            id
        }
    }
`;

export const UPDATE_LOGGABLE_EVENT_DETAILS_MUTATION = gql`
    mutation UpdateLoggableEventDetails($input: UpdateLoggableEventDetailsInput!) {
        updateLoggableEventDetails(input: $input) {
            id
        }
    }
`;

type UpdateLoggableEventDetailsInput = {
    eventId: string;
    name: string;
    warningThresholdInDays: number;
    labelIds: Array<string>;
};

export const DELETE_LOGGABLE_EVENT_MUTATION = gql`
    mutation DeleteLoggableEvent($input: DeleteLoggableEventInput!) {
        deleteLoggableEvent(input: $input) {
            id
        }
    }
`;

export const CREATE_EVENT_LABEL_MUTATION = gql`
    mutation CreateEventLabel($input: CreateEventLabelInput!) {
        createEventLabel(input: $input) {
            id
        }
    }
`;

export const UPDATE_EVENT_LABEL_MUTATION = gql`
    mutation UpdateEventLabel($input: UpdateEventLabelInput!) {
        updateEventLabel(input: $input) {
            id
        }
    }
`;

export const DELETE_EVENT_LABEL_MUTATION = gql`
    mutation DeleteEventLabel($input: DeleteEventLabelInput!) {
        DeleteEventLabel(input: $input) {
            id
        }
    }
`;

/**
 * Custom hook for managing loggable events API interactions.
 * @param offlineMode Whether the app is in offline mode. If true, it will not make any API calls.
 */
const useLoggableEventsApi = (offlineMode: boolean) => {
    const onError = (error: Error) => {
        console.error(error);
    };

    const {
        loading,
        data: fetchEventsAndLabelsData,
        refetch: refetchEventsAndLabelsData
    } = useQuery(GET_USERS_EVENTS_AND_LABELS_QUERY, {
        fetchPolicy: 'no-cache',
        onError,
        skip: offlineMode,
        variables: { userId: 'current' }
    });

    const onSuccessfulSubmit = () => {
        refetchEventsAndLabelsData();
    };

    const mutationOptions = { onCompleted: onSuccessfulSubmit, onError };

    const [createLoggableEventMutation] = useMutation(CREATE_LOGGABLE_EVENT_MUTATION, mutationOptions);
    const submitCreateLoggableEvent = offlineMode
        ? () => Promise.resolve({ data: { createLoggableEvent: { id: null } } })
        : (name: string, warningThresholdInDays: number, labelIds: Array<string>) => {
              return createLoggableEventMutation({
                  variables: {
                      input: {
                          name,
                          warningThresholdInDays,
                          labelIds
                      }
                  }
              });
          };

    const [createTimestampForEventMutation] = useMutation(CREATE_EVENT_RECORD_MUTATION, mutationOptions);
    const submitCreateEventRecord = offlineMode
        ? () => Promise.resolve({ data: { createTimestampForEvent: { id: null } } })
        : (eventId: string, timestampString: string) => {
              return createTimestampForEventMutation({
                  variables: {
                      input: {
                          loggableEventId: eventId,
                          timestamp: timestampString
                      }
                  }
              });
          };

    const [updateLoggableEventDetailsMutation] = useMutation(UPDATE_LOGGABLE_EVENT_DETAILS_MUTATION, mutationOptions);
    const submitUpdateLoggableEventDetails = offlineMode
        ? () => Promise.resolve({ data: { updateLoggableEventDetails: { id: null } } })
        : (updateLoggableEventDetailsInput: UpdateLoggableEventDetailsInput) => {
              return updateLoggableEventDetailsMutation({
                  variables: {
                      input: updateLoggableEventDetailsInput
                  }
              });
          };

    const [deleteLoggableEventMutation] = useMutation(DELETE_LOGGABLE_EVENT_MUTATION, mutationOptions);
    const submitDeleteLoggableEvent = offlineMode
        ? () => Promise.resolve({ data: { deleteEventLabel: { id: null } } })
        : (eventIdToRemove: string) => {
              return deleteLoggableEventMutation({
                  variables: {
                      input: { id: eventIdToRemove }
                  }
              });
          };

    const [createEventLabelMutation] = useMutation(CREATE_EVENT_LABEL_MUTATION, mutationOptions);
    const submitCreateEventLabel = offlineMode
        ? () => Promise.resolve({ data: { createEventLabel: { id: null } } })
        : (name: string) => {
              return createEventLabelMutation({
                  variables: {
                      input: { name }
                  }
              });
          };

    const [updateEventLabelMutation] = useMutation(UPDATE_EVENT_LABEL_MUTATION, mutationOptions);
    const submitUpdateEventLabel = offlineMode
        ? () => Promise.resolve({ data: { updateEventLabel: { id: null } } })
        : (eventLabelId: string, name: string) => {
              return updateEventLabelMutation({
                  variables: {
                      input: {
                          id: eventLabelId,
                          name
                      }
                  }
              });
          };

    const [deleteEventLabelMutation] = useMutation(DELETE_EVENT_LABEL_MUTATION, mutationOptions);
    const submitDeleteEventLabel = offlineMode
        ? () => Promise.resolve({ data: { deleteEventLabel: { id: null } } })
        : (eventLabelId: string) => {
              return deleteEventLabelMutation({
                  variables: {
                      input: {
                          id: eventLabelId
                      }
                  }
              });
          };

    return {
        isFetchingData: !offlineMode && loading,
        fetchedLoggableEvents: fetchEventsAndLabelsData?.user?.loggableEvents || [],
        fetchedEventLabels: fetchEventsAndLabelsData?.user?.eventLabels || [],
        refetchEventsAndLabelsData,
        submitCreateLoggableEvent,
        submitCreateEventRecord,
        submitUpdateLoggableEventDetails,
        submitDeleteLoggableEvent,
        submitCreateEventLabel,
        submitUpdateEventLabel,
        submitDeleteEventLabel
    };
};

export default useLoggableEventsApi;
