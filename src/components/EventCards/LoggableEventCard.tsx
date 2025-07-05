import { gql } from '@apollo/client';
import invariant from 'tiny-invariant';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { visuallyHidden } from '@mui/utils';

import EditEventCard from './EditEventCard';
import EventCard from './EventCard';
import EventCardHeader from './EventCardHeader';
import EventDatepicker from './EventDatepicker';
import EventLabel from '../EventLabels/EventLabel';
import EventRecord from './EventRecord';
import LastEventDisplay from './LastEventDisplay';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { getDaysSinceLastEventRecord } from '../../utils/time';
import { LoggableEvent, LoggableEventFragment } from '../../utils/types';
import { useToggle } from '../../utils/useToggle';

const MAX_RECORDS_TO_DISPLAY = 5;

const LOGGABLE_EVENT_FRAGMENT = gql`
    fragment LoggableEventFragment on LoggableEvent {
        name
        timestamps
        warningThresholdInDays
        createdAt
        labels {
            ...EventLabelFragment
        }
    }
    ${EventLabel.fragments.eventLabel}
`;

export const createLoggableEventFromFragment = ({
    id,
    name,
    timestamps,
    createdAt,
    warningThresholdInDays,
    labels
}: LoggableEventFragment): LoggableEvent => {
    return {
        id,
        name,
        timestamps: timestamps.map((timestampIsoString) => new Date(timestampIsoString)),
        createdAt: new Date(createdAt),
        warningThresholdInDays,
        labelIds: labels ? labels.map(({ id }) => id) : [],
        isSynced: true
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
    const { loggableEvents, addTimestampToEvent, deleteLoggableEvent, eventLabels } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ id }) => id === eventId);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const { value: editEventFormIsShowing, setTrue: showEditEventForm, setFalse: hideEditEventForm } = useToggle();
    const { value: datepickerIsShowing, setTrue: showDatepicker, setFalse: hideDatepicker } = useToggle();

    const { id, name, timestamps, warningThresholdInDays, labelIds } = currentLoggableEvent;
    const eventLabelObjects = eventLabels.filter(({ id }) => labelIds.includes(id));

    const currDate = new Date();

    const handleLogEventClick = async (dateToAdd?: Date | null) => {
        addTimestampToEvent(id, dateToAdd || currDate);
    };

    const handleEditEventClick = () => {
        showEditEventForm();
    };

    const handleDeleteEventClick = () => {
        deleteLoggableEvent(id);
    };

    const handleDatepickerAccept = (date: Date) => {
        handleLogEventClick(date);
        hideDatepicker();
    };

    const daysSinceLastEvent = getDaysSinceLastEventRecord(timestamps, currDate);

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
                <Stack direction="row" spacing={2} role="group" aria-label="Event logging actions">
                    <Button
                        size="small"
                        disabled={daysSinceLastEvent === 0}
                        onClick={() => {
                            handleLogEventClick();
                        }}
                        variant="contained"
                        aria-describedby={daysSinceLastEvent === 0 ? `today-disabled-${id}` : undefined}
                    >
                        Log Today
                    </Button>
                    {daysSinceLastEvent === 0 && (
                        <Box id={`today-disabled-${id}`} sx={visuallyHidden}>
                            Already logged today
                        </Box>
                    )}

                    <Button
                        size="small"
                        disableRipple
                        onClick={showDatepicker}
                        aria-expanded={datepickerIsShowing}
                        aria-controls={datepickerIsShowing ? `datepicker-${id}` : undefined}
                    >
                        Log custom date
                    </Button>
                </Stack>

                {typeof daysSinceLastEvent === 'number' && (
                    <LastEventDisplay
                        daysSinceLastEvent={daysSinceLastEvent}
                        warningThresholdInDays={warningThresholdInDays}
                    />
                )}

                <List>
                    <EventDatepicker
                        eventId={id}
                        isShowing={datepickerIsShowing}
                        disabledDates={timestamps}
                        onAccept={handleDatepickerAccept}
                        onClose={hideDatepicker}
                    />

                    {timestamps.length > 0 && (
                        <Typography variant="subtitle2" id={`records-heading-${id}`} role="heading" aria-level={3}>
                            Records {timestamps.length >= MAX_RECORDS_TO_DISPLAY ? ' (Up to 5 most recent)' : ''}
                        </Typography>
                    )}
                    <Box
                        role="list"
                        aria-labelledby={`records-heading-${id}`}
                        aria-label={timestamps.length === 0 ? 'No event records' : `${timestamps.length} event records`}
                    >
                        {timestamps.slice(0, MAX_RECORDS_TO_DISPLAY).map((record: Date) => (
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
                {eventLabelObjects.length > 0 && (
                    <Box mt={1} display="flex" flexWrap="wrap" gap={1} role="group" aria-label="Event labels">
                        {eventLabelObjects.map(({ id: labelId, name: labelName }) => (
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
    loggableEvent: LOGGABLE_EVENT_FRAGMENT
};

export default LoggableEventCard;
