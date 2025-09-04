import { gql, useQuery } from '@apollo/client';
import invariant from 'tiny-invariant';

import { useAuth } from '../../providers/AuthProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import LoggableEventCard from '../EventCards/LoggableEventCard';
import EventLabel from '../EventLabels/EventLabel';
import LoggableEventsView from '../Views/LoggableEventsView';

export const GET_LOGGABLE_EVENTS_FOR_USER = gql`
    query GetLoggableEventsForUser {
        loggedInUser {
            id
            loggableEvents {
                id
                ...LoggableEventCardFragment
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

/**
 * LoggableEventsGQL component that fetches and displays loggable events and event labels for the authenticated user.
 * Fetched data is stored in the Apollo Client cache and child components can access it via fragments.
 * This component controls the loading state and error state of the main view based on the fetch status.
 */
const LoggableEventsGQL = () => {
    const { user, isOfflineMode, clearAuthData } = useAuth();
    const { showSnackbar } = useViewOptions();

    invariant(user, 'User is not authenticated');

    const { loading, error } = useQuery(GET_LOGGABLE_EVENTS_FOR_USER, {
        // In offline mode, only read from cache, don't try network
        fetchPolicy: isOfflineMode ? 'cache-only' : 'cache-and-network'
    });

    if (error && error.graphQLErrors.some((e) => e.extensions?.code === 'UNAUTHORIZED')) {
        // Send user back to login screen
        clearAuthData();
        showSnackbar('You have been logged out due to inactivity.');
    }

    return <LoggableEventsView isLoading={loading} isShowingFetchError={Boolean(error && !isOfflineMode)} />;
};

export default LoggableEventsGQL;
