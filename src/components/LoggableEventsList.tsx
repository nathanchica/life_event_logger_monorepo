import Grid from '@mui/material/Grid';

import LoggableEventCard from './EventCards/LoggableEventCard';

import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { LoggableEvent } from '../utils/types';

/**
 * LoggableEventsList component for displaying a list of loggable events.
 * It filters events based on the active event label.
 */
const LoggableEventsList = () => {
    const { activeEventLabelId } = useViewOptions();
    const { loggableEvents } = useLoggableEventsContext();

    const filteredEvents: Array<LoggableEvent> = activeEventLabelId
        ? loggableEvents.filter(({ labelIds }) => labelIds && labelIds.includes(activeEventLabelId))
        : loggableEvents;

    return (
        <>
            {filteredEvents.map(({ id }) => {
                return (
                    <Grid item key={id} role="listitem">
                        <LoggableEventCard eventId={id} />
                    </Grid>
                );
            })}
        </>
    );
};

export default LoggableEventsList;
