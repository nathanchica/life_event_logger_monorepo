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

export const UPDATE_LOGGABLE_EVENT_MUTATION = gql`
    query UpdateLoggableEvent($loggableEventId: ID!, $input: UpdateLoggableEventInput!) {
        updateLoggableEvent(id: $loggableEventId, input: $input) {
            id
            name
            active
        }
    }
`;

export const CREATE_EVENT_RECORD_MUTATION = gql`
    mutation CreateEventRecord($loggableEventId: ID!, $input: CreateEventRecordInput!) {
        createEventRecord(loggableEventId: $loggableEventId, input: $input) {
            id
            name
        }
    }
`;

const useLoggableEventsApi = () => {
    const {
        loading,
        data: fetchLoggableEventsData,
        error: fetchError,
        refetch: refetchLoggableEvents
    } = useQuery(GET_LOGGABLE_EVENTS_QUERY, {
        fetchPolicy: 'no-cache'
    });

    const [submitCreateEventRecord, { loading: createEventRecordIsSubmitting, error: createEventRecordError }] =
        useMutation(CREATE_EVENT_RECORD_MUTATION);

    return {
        /** Fetch loggable events */
        isLoading: loading,
        fetchError,
        fetchedLoggableEvents: fetchLoggableEventsData?.loggableEvents || [],
        refetchLoggableEvents,
        /** Submit create event record */
        submitCreateEventRecord,
        createEventRecordIsSubmitting,
        createEventRecordError
    };
};

export default useLoggableEventsApi;
