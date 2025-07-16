import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
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
    const { value: datepickerIsShowing, setFalse: hideDatepicker, toggle: toggleDatepicker } = useToggle();

    const handleLogEventClick = (dateToAdd?: Date | null) => {
        const currentDate = new Date();
        addTimestampToEvent({
            eventId,
            timestamp: (dateToAdd || currentDate).toISOString()
        });
    };

    const handleDatepickerAccept = (date: Date) => {
        handleLogEventClick(date);
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

                <ToggleButton
                    size="small"
                    value="edit"
                    disableRipple
                    onClick={toggleDatepicker}
                    disabled={addTimestampIsLoading}
                    selected={datepickerIsShowing}
                    aria-expanded={datepickerIsShowing}
                    aria-controls={datepickerIsShowing ? `datepicker-${eventId}` : undefined}
                >
                    Log custom date
                </ToggleButton>
            </Stack>

            <EventDatepicker
                eventId={eventId}
                isShowing={datepickerIsShowing}
                disabledDates={timestamps}
                onAccept={handleDatepickerAccept}
            />
        </>
    );
};

export default EventCardLogActions;
