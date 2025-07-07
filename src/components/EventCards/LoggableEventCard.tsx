import { gql } from '@apollo/client';
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
import { getDaysSinceLastEventRecord } from '../../utils/time';
import { LoggableEvent, LoggableEventFragment, EventLabelFragment } from '../../utils/types';
import { useToggle } from '../../utils/useToggle';
import EventLabel from '../EventLabels/EventLabel';

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
        labelIds: labels.map(({ id }) => id),
        isSynced: true
    };
};

type Props = {
    loggableEventFragment: LoggableEventFragment;
};

/**
 * LoggableEventCard component for displaying a card that allows users to log events.
 * It shows the event name, a button to log today's event, a button to log a custom date,
 * and a list of previously logged events.
 * It also provides options to edit or delete the event.
 * If the event has not been logged for a certain number of days, it displays a warning.
 */
const LoggableEventCard = ({ loggableEventFragment }: Props) => {
    const { deleteLoggableEvent } = useLoggableEvents();
    const { id, name, timestamps, warningThresholdInDays } = createLoggableEventFromFragment(loggableEventFragment);

    const { value: editEventFormIsShowing, setTrue: showEditEventForm, setFalse: hideEditEventForm } = useToggle();

    const eventLabelFragments: Array<EventLabelFragment> = loggableEventFragment.labels;

    const currDate = new Date();

    const handleEditEventClick = () => {
        showEditEventForm();
    };

    const handleDeleteEventClick = () => {
        deleteLoggableEvent(id);
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
                <EventCardLogActions eventId={id} daysSinceLastEvent={daysSinceLastEvent} timestamps={timestamps} />

                {typeof daysSinceLastEvent === 'number' && (
                    <LastEventDisplay
                        daysSinceLastEvent={daysSinceLastEvent}
                        warningThresholdInDays={warningThresholdInDays}
                    />
                )}

                {timestamps.length > 0 && (
                    <Typography variant="subtitle2" id={`records-heading-${id}`} role="heading" aria-level={3}>
                        Records {timestamps.length >= MAX_RECORDS_TO_DISPLAY ? ' (Up to 5 most recent)' : ''}
                    </Typography>
                )}
                <List
                    aria-labelledby={timestamps.length > 0 ? `records-heading-${id}` : undefined}
                    aria-label={timestamps.length === 0 ? 'No event records' : undefined}
                >
                    <Box>
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
    loggableEvent: LOGGABLE_EVENT_FRAGMENT
};

export default LoggableEventCard;
