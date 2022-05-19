import { gql, useQuery, useMutation } from '@apollo/client';

export const GET_LOGGABLE_EVENTS_QUERY = gql`
    query GetLoggableEvents {
        loggableEvents {
            id
            name
            dateTimeRecords
            active
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

export const UPDATE_LOGGABLE_EVENT_MUTATION = gql`
    mutation UpdateLoggableEvent($loggableEventId: ID!, $input: UpdateLoggableEventInput!) {
        updateLoggableEvent(id: $loggableEventId, input: $input) {
            id
        }
    }
`;

export const DELETE_LOGGABLE_EVENT_MUTATION = gql`
    mutation DeleteLoggableEvent($loggableEventId: ID!) {
        deleteLoggableEvent(id: $loggableEventId) {
            id
        }
    }
`;

const useLoggableEventsApi = (offlineMode: boolean) => {
    const onSuccessfulSubmit = () => {
        refetchLoggableEvents();
    };

    const onError = (error: Error) => {
        console.error(error);
    };

    const mutationOptions = { onCompleted: onSuccessfulSubmit, onError };

    const {
        loading,
        data: fetchLoggableEventsData,
        refetch: refetchLoggableEvents
    } = useQuery(GET_LOGGABLE_EVENTS_QUERY, {
        fetchPolicy: 'no-cache',
        onError,
        skip: offlineMode
    });

    const [createLoggableEventMutation] = useMutation(CREATE_LOGGABLE_EVENT_MUTATION, mutationOptions);
    const submitCreateLoggableEvent = offlineMode
        ? () => Promise.resolve({ data: { createLoggableEvent: { id: null } } })
        : (newEventName: string) => {
              return createLoggableEventMutation({
                  variables: {
                      input: {
                          name: newEventName
                      }
                  }
              });
          };

    const [deleteLoggableEventMutation] = useMutation(DELETE_LOGGABLE_EVENT_MUTATION, mutationOptions);
    const submitDeleteLoggableEvent = offlineMode
        ? () => Promise.resolve({})
        : (eventIdToRemove: string) => {
              return deleteLoggableEventMutation({
                  variables: {
                      loggableEventId: eventIdToRemove
                  }
              });
          };

    // const [createEventRecordMutation] = useMutation(CREATE_EVENT_RECORD_MUTATION, mutationOptions);
    // const submitCreateEventRecord = offlineMode
    //     ? () => Promise.resolve({})
    //     : (eventIdToUpdate: string, newEventDateTimeISOString: string) => {
    //           return createEventRecordMutation({
    //               variables: {
    //                   loggableEventId: eventIdToUpdate,
    //                   input: {
    //                       dateTimeISO: newEventDateTimeISOString
    //                   }
    //               }
    //           });
    //       };

    return {
        isLoading: loading,
        fetchedLoggableEvents: fetchLoggableEventsData?.loggableEvents || [],
        refetchLoggableEvents,
        submitCreateLoggableEvent,
        submitDeleteLoggableEvent,
        // submitCreateEventRecord
    };
};

export default useLoggableEventsApi;
