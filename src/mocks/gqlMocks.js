import {
    GET_USERS_EVENTS_AND_LABELS_QUERY,
    CREATE_LOGGABLE_EVENT_MUTATION,
    CREATE_EVENT_RECORD_MUTATION,
    UPDATE_LOGGABLE_EVENT_DETAILS_MUTATION,
    DELETE_LOGGABLE_EVENT_MUTATION,
    CREATE_EVENT_LABEL_MUTATION,
    UPDATE_EVENT_LABEL_MUTATION,
    DELETE_EVENT_LABEL_MUTATION
} from '../utils/useLoggableEventsApi';

export const mocks = [
    {
        request: {
            query: GET_USERS_EVENTS_AND_LABELS_QUERY,
            variables: { userId: 'test-user' }
        },
        result: {
            data: {
                user: {
                    loggableEvents: [],
                    eventLabels: []
                }
            }
        }
    }
    // Add more mocks for mutations as needed
];
