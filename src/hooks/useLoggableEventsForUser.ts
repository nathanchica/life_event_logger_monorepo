import { gql, useQuery, WatchQueryFetchPolicy } from '@apollo/client';

import { LoggableEventFragment, EventLabelFragment, User } from '../utils/types';

export const LOGGABLE_EVENT_FRAGMENT = gql`
    fragment LoggableEventFragment on LoggableEvent {
        id
        name
        timestamps
        warningThresholdInDays
        createdAt
        labels {
            id
            name
            createdAt
        }
    }
`;

export const EVENT_LABEL_FRAGMENT = gql`
    fragment EventLabelFragment on EventLabel {
        id
        name
        createdAt
    }
`;

export const GET_LOGGABLE_EVENTS_FOR_USER = gql`
    query GetLoggableEventsForUser($userId: String!) {
        user(userId: $userId) {
            id
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
    ${EVENT_LABEL_FRAGMENT}
    ${LOGGABLE_EVENT_FRAGMENT}
`;

type UseLoggableEventsForUserOptions = {
    fetchPolicy?: WatchQueryFetchPolicy;
};

/**
 * Hook to fetch user's loggable events and event labels, then stores them in Apollo Client cache.
 *
 * This hook provides a single source of truth for user data across the app. Components can use this hook
 * to access loggable events and event labels stored in the Apollo Client cache. Mutations will update the
 * cache and components will re-render automatically with the latest data. Components should parse the fragments
 * themselves to extract the necessary fields.
 *
 * @param user - The authenticated user
 * @param options - Optional configuration including fetchPolicy
 * @returns Object containing user data and loading/error states
 */
export const useLoggableEventsForUser = (user: User, options: UseLoggableEventsForUserOptions = {}) => {
    const { fetchPolicy = 'cache-only' } = options;

    const { data, loading, error } = useQuery(GET_LOGGABLE_EVENTS_FOR_USER, {
        variables: { userId: user.id },
        fetchPolicy
    });

    const loggableEventsFragments: Array<LoggableEventFragment> = data?.user?.loggableEvents || [];
    const eventLabelsFragments: Array<EventLabelFragment> = data?.user?.eventLabels || [];

    return {
        loggableEventsFragments,
        eventLabelsFragments,
        loading,
        error
    };
};
