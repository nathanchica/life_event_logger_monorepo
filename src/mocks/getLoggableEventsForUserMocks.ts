import { createMockEventLabelFragment } from './eventLabels';
import { createMockLoggableEventFragment } from './loggableEvent';
import { createMockUser } from './user';

import { GET_LOGGABLE_EVENTS_FOR_USER } from '../hooks/useLoggableEventsForUser';
import { LoggableEventFragment, EventLabelFragment } from '../utils/types';

export const createGetLoggableEventsForUserMock = (
    userId: string = createMockUser().id,
    loggableEvents: Array<LoggableEventFragment> = [
        createMockLoggableEventFragment(),
        createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2' })
    ],
    eventLabels: Array<EventLabelFragment> = [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' })
    ]
) => {
    return {
        request: {
            query: GET_LOGGABLE_EVENTS_FOR_USER,
            variables: { userId }
        },
        result: {
            data: {
                user: {
                    __typename: 'User',
                    loggableEvents,
                    eventLabels
                }
            }
        }
    };
};

export const createGetLoggableEventsForUserErrorMock = (userId: string = createMockUser().id) => ({
    request: {
        query: GET_LOGGABLE_EVENTS_FOR_USER,
        variables: { userId }
    },
    error: new Error('GraphQL Error: Unable to fetch loggable events')
});
