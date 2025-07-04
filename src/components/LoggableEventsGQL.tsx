import { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import LoggableEventsList from './LoggableEventsList';
import { useAuth } from '../providers/AuthProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { LoggableEvent, LoggableEventGQL } from '../utils/types';

export const GET_LOGGABLE_EVENTS_FOR_USER = gql`
    query GetLoggableEventsForUser($userId: String!) {
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
        }
    }
`;

const LoggableEventsGQL = () => {
    const { user } = useAuth();
    const { loadLoggableEvents } = useLoggableEventsContext();

    if (!user) throw new Error('User is not authenticated, please log in.');

    const { data, loading, error } = useQuery(GET_LOGGABLE_EVENTS_FOR_USER, {
        variables: { userId: user.id }
    });

    const dataIsFetched = data && !loading && !error;

    let fetchedLoggableEvents: Array<LoggableEvent> = [];
    if (dataIsFetched) {
        const loggableEvents: Array<LoggableEventGQL> = data.user.loggableEvents;
        fetchedLoggableEvents = loggableEvents.map((event) => ({
            id: event.id,
            name: event.name,
            timestamps: event.timestamps.map((timestampIsoString) => new Date(timestampIsoString)),
            createdAt: new Date(event.createdAt),
            warningThresholdInDays: event.warningThresholdInDays,
            labelIds: event.labels ? event.labels.map(({ id }) => id) : [],
            isSynced: true
        }));
    }

    useEffect(() => {
        if (dataIsFetched) {
            loadLoggableEvents(fetchedLoggableEvents);
        }
    }, [dataIsFetched]);

    if (error) throw new Error(`Error fetching loggable events: ${error.message}`);

    return <LoggableEventsList />;
};

export default LoggableEventsGQL;
