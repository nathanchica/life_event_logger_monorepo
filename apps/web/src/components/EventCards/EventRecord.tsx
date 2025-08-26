import { useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { grey } from '@mui/material/colors';
import { differenceInCalendarDays } from 'date-fns';

import { useLoggableEvents } from '../../hooks/useLoggableEvents';

type Props = {
    eventId: string;
    recordDate: Date;
};

/**
 * EventRecord component for displaying a single record of an event.
 * It shows the date of the record and allows users to delete it if hovered.
 * If the record date is in the future, it will be displayed in a lighter color.
 */
const EventRecord = ({ eventId, recordDate }: Props) => {
    const [isHovered, setIsHovered] = useState(false);
    const { removeTimestampFromEvent, removeTimestampIsLoading } = useLoggableEvents();

    const isFutureDate = differenceInCalendarDays(recordDate, new Date()) > 0;

    const onDeleteRecord = () => {
        removeTimestampFromEvent({
            input: {
                id: eventId,
                timestamp: recordDate.toISOString()
            }
        });
    };

    return (
        <ListItem
            key={`${eventId}-${recordDate.toISOString()}`}
            disablePadding
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ListItemText
                slotProps={{
                    primary: { typography: 'body2' }
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ...(isFutureDate && { color: grey[400] })
                }}
            >
                {recordDate.toLocaleDateString('en-US')}
                {isHovered && (
                    <IconButton
                        edge="end"
                        aria-label="Dismiss record"
                        size="small"
                        disabled={removeTimestampIsLoading}
                        sx={{
                            marginLeft: 1,
                            padding: '0px'
                        }}
                        onClick={onDeleteRecord}
                    >
                        <CancelIcon fontSize="small" />
                    </IconButton>
                )}
            </ListItemText>
        </ListItem>
    );
};

export default EventRecord;
