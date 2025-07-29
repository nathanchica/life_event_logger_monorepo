import { gql, useFragment } from '@apollo/client';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import EditEventCard from './EditEventCard';
import EventCard from './EventCard';
import EventCardHeader from './EventCardHeader';
import EventCardLogActions from './EventCardLogActions';
import EventRecord from './EventRecord';
import LastEventDisplay from './LastEventDisplay';

import { useLoggableEvents } from '../../hooks/useLoggableEvents';
import { getDaysSinceLastEventRecord, sortDateObjectsByNewestFirst } from '../../utils/time';
import { LoggableEvent, LoggableEventFragment, EventLabelFragment } from '../../utils/types';
import { useToggle } from '../../utils/useToggle';

const MAX_RECORDS_TO_DISPLAY = 5;

const LOGGABLE_EVENT_CARD_FRAGMENT = gql`
    fragment LoggableEventCardFragment on LoggableEvent {
        id
        name
        timestamps
        warningThresholdInDays
        labels {
            id
            name
        }
    }
`;

export const createLoggableEventFromFragment = ({
    id,
    name,
    timestamps,
    warningThresholdInDays,
    labels
}: LoggableEventFragment): LoggableEvent => {
    return {
        id,
        name,
        timestamps: timestamps.map((timestampIsoString) => new Date(timestampIsoString)),
        warningThresholdInDays,
        labelIds: labels.map(({ id }) => id)
    };
};

type Props = {
    eventId: string;
};

/**
 * LoggableEventCard component for displaying a card that allows users to log events.
 * It shows the event name, a button to log today's event, a button to log a custom date,
 * and a list of previously logged events.
 * It also provides options to edit or delete the event.
 * If the event has not been logged for a certain number of days, it displays a warning.
 */
const LoggableEventCard = ({ eventId }: Props) => {
    const { data } = useFragment({
        fragment: LOGGABLE_EVENT_CARD_FRAGMENT,
        fragmentName: 'LoggableEventCardFragment',
        from: {
            __typename: 'LoggableEvent',
            id: eventId
        }
    });

    const { deleteLoggableEvent } = useLoggableEvents();
    const { value: editEventFormIsShowing, setTrue: showEditEventForm, setFalse: hideEditEventForm } = useToggle();

    // return null if no data is available (can happen when event is being deleted and events list hasn't updated yet)
    if (!data || Object.keys(data).length === 0) return null;

    const { id, name, timestamps, warningThresholdInDays } = createLoggableEventFromFragment(data);
    const eventLabelFragments: Array<EventLabelFragment> = data.labels;

    const handleEditEventClick = () => {
        showEditEventForm();
    };

    const handleDeleteEventClick = () => {
        deleteLoggableEvent({ input: { id } });
    };

    const currDate = new Date();
    const sortedTimestamps = [...timestamps].sort(sortDateObjectsByNewestFirst);
    const daysSinceLastEvent = getDaysSinceLastEventRecord(sortedTimestamps, currDate);
    const lastEventDisplayIsShowing = typeof daysSinceLastEvent === 'number';

    return editEventFormIsShowing ? (
        <EditEventCard onDismiss={hideEditEventForm} eventIdToEdit={id} />
    ) : (
        <EventCard role="article" aria-labelledby={`event-title-${id}`}>
            <CardContent>
                <EventCardHeader
                    eventId={id}
                    name={name}
                    onEditEvent={handleEditEventClick}
                    onDeleteEvent={handleDeleteEventClick}
                />
                <EventCardLogActions
                    eventId={id}
                    daysSinceLastEvent={daysSinceLastEvent}
                    timestamps={sortedTimestamps}
                />

                {lastEventDisplayIsShowing && (
                    <LastEventDisplay
                        daysSinceLastEvent={daysSinceLastEvent}
                        warningThresholdInDays={warningThresholdInDays}
                    />
                )}

                {sortedTimestamps.length > 0 && (
                    <Box sx={{ mt: lastEventDisplayIsShowing ? 0 : 2 }}>
                        <Typography variant="overline" id={`records-heading-${id}`} role="heading" aria-level={6}>
                            Records {sortedTimestamps.length >= MAX_RECORDS_TO_DISPLAY ? ' (Up to 5 most recent)' : ''}
                        </Typography>
                    </Box>
                )}
                <List
                    aria-labelledby={sortedTimestamps.length > 0 ? `records-heading-${id}` : undefined}
                    aria-label={sortedTimestamps.length === 0 ? 'No event records' : undefined}
                >
                    <Box>
                        {sortedTimestamps.slice(0, MAX_RECORDS_TO_DISPLAY).map((record: Date) => (
                            <EventRecord
                                key={`${id}-${record.toISOString()}`}
                                eventId={id}
                                recordDate={record}
                                currentDate={currDate}
                            />
                        ))}
                    </Box>
                </List>

                {/* Event labels */}
                {eventLabelFragments.length > 0 && (
                    <Box mt={1} display="flex" flexWrap="wrap" gap={1} role="group" aria-label="Event labels">
                        {eventLabelFragments.map(({ id: labelId, name: labelName }) => (
                            <Chip
                                key={labelId}
                                label={labelName}
                                size="small"
                                role="listitem"
                                aria-label={`Label: ${labelName}`}
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </EventCard>
    );
};

LoggableEventCard.fragments = {
    loggableEvent: LOGGABLE_EVENT_CARD_FRAGMENT
};

export default LoggableEventCard;
