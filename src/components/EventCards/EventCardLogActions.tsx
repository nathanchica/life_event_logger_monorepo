import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { visuallyHidden } from '@mui/utils';

import EventDatepicker from './EventDatepicker';

import { useLoggableEvents } from '../../hooks/useLoggableEvents';
import { useToggle } from '../../utils/useToggle';

type Props = {
    eventId: string;
    daysSinceLastEvent: number | undefined;
    timestamps: Date[];
};

/**
 * EventCardLogActions component for handling event logging actions.
 * Includes buttons to log today's event and log a custom date, along with the date picker.
 */
const EventCardLogActions = ({ eventId, daysSinceLastEvent, timestamps }: Props) => {
    const { addTimestampToEvent, addTimestampIsLoading } = useLoggableEvents();
    const { value: datepickerIsShowing, setTrue: showDatepicker, setFalse: hideDatepicker } = useToggle();

    const handleLogEventClick = async (dateToAdd?: Date | null) => {
        const currentDate = new Date();
        await addTimestampToEvent(eventId, dateToAdd || currentDate);
    };

    const handleDatepickerAccept = async (date: Date) => {
        await handleLogEventClick(date);
        hideDatepicker();
    };

    const isLogTodayDisabled = daysSinceLastEvent === 0 || addTimestampIsLoading;

    return (
        <>
            <Stack direction="row" spacing={2} role="group" aria-label="Event logging actions">
                <Button
                    size="small"
                    disabled={isLogTodayDisabled}
                    onClick={() => handleLogEventClick()}
                    variant="contained"
                    aria-describedby={daysSinceLastEvent === 0 ? `today-disabled-${eventId}` : undefined}
                >
                    Log Today
                </Button>
                {daysSinceLastEvent === 0 && (
                    <Box id={`today-disabled-${eventId}`} sx={visuallyHidden}>
                        Already logged today
                    </Box>
                )}

                <Button
                    size="small"
                    disableRipple
                    onClick={showDatepicker}
                    disabled={addTimestampIsLoading}
                    aria-expanded={datepickerIsShowing}
                    aria-controls={datepickerIsShowing ? `datepicker-${eventId}` : undefined}
                >
                    Log custom date
                </Button>
            </Stack>

            <EventDatepicker
                eventId={eventId}
                isShowing={datepickerIsShowing}
                disabledDates={timestamps}
                onAccept={handleDatepickerAccept}
                onClose={hideDatepicker}
            />
        </>
    );
};

export default EventCardLogActions;
