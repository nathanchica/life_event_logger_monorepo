import { useEffect } from 'react';

import { gql, useQuery } from '@apollo/client';

import LoggableEventCard, { createLoggableEventFromFragment } from './EventCards/LoggableEventCard';
import EventLabel, { createEventLabelFromFragment } from './EventLabels/EventLabel';
import LoggableEventsView from './LoggableEventsView';

import { useAuth } from '../providers/AuthProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { EventLabel as EventLabelType, EventLabelFragment, LoggableEvent, LoggableEventFragment } from '../utils/types';

export const GET_LOGGABLE_EVENTS_FOR_USER = gql`
    query GetLoggableEventsForUser($userId: String!) {
        user(userId: $userId) {
            loggableEvents {
                id
                ...LoggableEventFragment
            }
            eventLabels {
                id
                ...EventLabelFragment
            }
        }
    }
    ${EventLabel.fragments.eventLabel}
    ${LoggableEventCard.fragments.loggableEvent}
`;

const LoggableEventsGQL = () => {
    const { user } = useAuth();
    const { loadLoggableEvents, loadEventLabels } = useLoggableEventsContext();

    if (!user) throw new Error('User is not authenticated, please log in.');

    const { data, loading, error } = useQuery(GET_LOGGABLE_EVENTS_FOR_USER, {
        variables: { userId: user.id }
    });

    const dataIsFetched = data && !loading && !error;

    let fetchedLoggableEvents: Array<LoggableEvent> = [];
    let fetchedEventLabels: Array<EventLabelType> = [];
    if (dataIsFetched) {
        const loggableEvents: Array<LoggableEventFragment> = data.user.loggableEvents;
        fetchedLoggableEvents = loggableEvents.map((loggableEventFragment) =>
            createLoggableEventFromFragment(loggableEventFragment)
        );

        const eventLabels: Array<EventLabelFragment> = data.user.eventLabels;
        fetchedEventLabels = eventLabels.map((eventLabelFragment) => createEventLabelFromFragment(eventLabelFragment));
    }

    useEffect(() => {
        if (dataIsFetched) {
            loadLoggableEvents(fetchedLoggableEvents);
            loadEventLabels(fetchedEventLabels);
        }
    }, [dataIsFetched]);

    return <LoggableEventsView isLoading={loading} isShowingFetchError={Boolean(error)} />;
};

export default LoggableEventsGQL;
