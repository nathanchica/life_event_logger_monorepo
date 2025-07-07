import invariant from 'tiny-invariant';

import LoggableEventsView from './LoggableEventsView';

import { useLoggableEventsForUser } from '../hooks/useLoggableEventsForUser';
import { useAuth } from '../providers/AuthProvider';

/**
 * LoggableEventsGQL component that fetches and displays loggable events and event labels for the authenticated user.
 * This component controls the loading state and error state of the main view based on the fetch status.
 */
const LoggableEventsGQL = () => {
    const { user, isOfflineMode } = useAuth();

    invariant(user, 'User is not authenticated');

    const { loading, error } = useLoggableEventsForUser(user, {
        // In offline mode, only read from cache, don't try network
        fetchPolicy: isOfflineMode ? 'cache-only' : 'cache-and-network'
    });

    return <LoggableEventsView isLoading={loading} isShowingFetchError={Boolean(error && !isOfflineMode)} />;
};

export default LoggableEventsGQL;
