import { gql, useFragment } from '@apollo/client';
import Grid from '@mui/material/Grid';
import invariant from 'tiny-invariant';

import LoggableEventCard from './EventCards/LoggableEventCard';

import { useAuth } from '../providers/AuthProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';

type LoggableEventFragment = {
    id: string;
    name: string;
    labels: Array<{
        id: string;
    }>;
};

const LOGGABLE_EVENTS_FOR_USER_FRAGMENT = gql`
    fragment LoggableEventsForUserFragment on User {
        loggableEvents {
            id
            name
            labels {
                id
            }
        }
    }
`;

/**
 * LoggableEventsList component for displaying a list of loggable events.
 * It filters events based on the active event label.
 */
const LoggableEventsList = () => {
    const { user } = useAuth();
    const { activeEventLabelId } = useViewOptions();

    invariant(user, 'User is not authenticated');

    const { complete, data } = useFragment({
        fragment: LOGGABLE_EVENTS_FOR_USER_FRAGMENT,
        fragmentName: 'LoggableEventsForUserFragment',
        from: {
            __typename: 'User',
            id: user.id
        }
    });
    const loggableEventsFragments: Array<LoggableEventFragment> = complete ? data.loggableEvents : [];

    const filteredEventFragments: Array<LoggableEventFragment> = activeEventLabelId
        ? loggableEventsFragments.filter(
              ({ labels }) => labels && labels.some((label) => label.id === activeEventLabelId)
          )
        : loggableEventsFragments;

    return (
        <>
            {filteredEventFragments.map(({ id, name }) => {
                return (
                    <Grid key={`event-${name}`} role="listitem">
                        <LoggableEventCard eventId={id} />
                    </Grid>
                );
            })}
        </>
    );
};

export default LoggableEventsList;
