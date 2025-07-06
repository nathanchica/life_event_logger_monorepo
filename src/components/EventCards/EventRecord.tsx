/** @jsxImportSource @emotion/react */

import { useState } from 'react';

import { css } from '@emotion/react';
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { grey } from '@mui/material/colors';
import invariant from 'tiny-invariant';

import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { getNumberOfDaysBetweenDates } from '../../utils/time';

type Props = {
    eventId: string;
    recordDate: Date;
    currentDate: Date;
};

/**
 * EventRecord component for displaying a single record of an event.
 * It shows the date of the record and allows users to delete it if hovered.
 * If the record date is in the future, it will be displayed in a lighter color.
 */
const EventRecord = ({ eventId, recordDate, currentDate }: Props) => {
    const [isHovered, setIsHovered] = useState(false);
    const { loggableEvents, updateLoggableEventDetails } = useLoggableEventsContext();

    const isFutureDate = getNumberOfDaysBetweenDates(recordDate, currentDate) < 0;

    const onDeleteRecord = () => {
        const currentLoggableEvent = loggableEvents.find(({ id }) => id === eventId);

        invariant(currentLoggableEvent, 'Must be a valid loggable event');

        // Remove the record from the event's timestamps
        const updatedTimestamps = currentLoggableEvent.timestamps.filter(
            (record: Date) => record.toDateString() !== recordDate.toDateString()
        );

        // Update the event with the new timestamps
        updateLoggableEventDetails({
            ...currentLoggableEvent,
            timestamps: updatedTimestamps
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
                css={[
                    isFutureDate
                        ? css`
                              color: ${grey[400]};
                          `
                        : null,
                    css`
                        display: flex;
                        align-items: center;
                    `
                ]}
            >
                {recordDate.toLocaleDateString('en-US')}
                {isHovered && (
                    <IconButton
                        edge="end"
                        aria-label="Dismiss record"
                        size="small"
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
