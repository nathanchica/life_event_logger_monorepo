import Grid from '@mui/material/Grid';
import LoggableEventCard from './EventCards/LoggableEventCard';
import { EventCardSkeleton } from './EventCards/EventCard';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { LoggableEvent } from '../utils/types';

type Props = {
    offlineMode?: boolean;
};

const LoggableEventsList = ({ offlineMode = false }: Props) => {
    const { activeEventLabelId } = useViewOptions();
    const { dataIsLoaded, loggableEvents } = useLoggableEventsContext();

    if (!dataIsLoaded && !offlineMode) {
        return (
            <>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
            </>
        );
    }

    const filteredEvents: Array<LoggableEvent> = activeEventLabelId
        ? loggableEvents.filter(({ labelIds }) => labelIds && labelIds.includes(activeEventLabelId))
        : loggableEvents;

    return (
        <>
            {filteredEvents.map(({ id, name }) => {
                return (
                    <Grid item key={`${name}-card`} role="listitem">
                        <LoggableEventCard eventId={id} />
                    </Grid>
                );
            })}
        </>
    );
};

export default LoggableEventsList;
