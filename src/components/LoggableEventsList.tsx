import Grid from '@mui/material/Grid';
import invariant from 'tiny-invariant';

import LoggableEventCard from './EventCards/LoggableEventCard';

import { useLoggableEventsForUser } from '../hooks/useLoggableEventsForUser';
import { useAuth } from '../providers/AuthProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { LoggableEventFragment } from '../utils/types';

/**
 * LoggableEventsList component for displaying a list of loggable events.
 * It filters events based on the active event label.
 */
const LoggableEventsList = () => {
    const { user } = useAuth();
    const { activeEventLabelId } = useViewOptions();

    invariant(user, 'User is not authenticated');

    const { loggableEventsFragments } = useLoggableEventsForUser(user);

    const filteredEventFragments: Array<LoggableEventFragment> = activeEventLabelId
        ? loggableEventsFragments.filter(
              ({ labels }) => labels && labels.some((label) => label.id === activeEventLabelId)
          )
        : loggableEventsFragments;

    return (
        <>
            {filteredEventFragments.map((loggableEventFragment) => {
                return (
                    <Grid key={loggableEventFragment.id} role="listitem">
                        <LoggableEventCard loggableEventFragment={loggableEventFragment} />
                    </Grid>
                );
            })}
        </>
    );
};

export default LoggableEventsList;
