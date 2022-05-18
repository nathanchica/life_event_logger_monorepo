import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import TextField from '@mui/material/TextField';
import * as colors from '@mui/material/colors';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EventCard from './EventCard';
import { useLoggableEventsContext, EVENT_DEFAULT_VALUES } from '../providers/LoggableEventsProvider';

export const MAX_LENGTH = 25;

type Props = {
    onDismiss: () => void;
    eventIdToEdit?: string;
};

const EditEventCard = ({ onDismiss, eventIdToEdit }: Props) => {
    const { loggableEvents, addLoggableEvent, updateLoggableEvent } = useLoggableEventsContext();

    const eventToEdit = loggableEvents.find(({ id }) => id === eventIdToEdit) || EVENT_DEFAULT_VALUES;

    const [eventNameInputValue, setEventNameInputValue] = useState(eventToEdit.name);
    const resetEventNameInputValue = () => setEventNameInputValue(EVENT_DEFAULT_VALUES.name);
    const eventNameIsTooLong = eventNameInputValue.length > MAX_LENGTH;
    const eventNameAlreadyExists = Boolean(
        loggableEvents.find(({ id, name }) => id !== eventIdToEdit && name === eventNameInputValue)
    );
    const eventNameIsValid =
        eventNameInputValue.length > 0 && eventNameInputValue.length <= MAX_LENGTH && !eventNameAlreadyExists;

    const [warningThresholdInputValue, setWarningThresholdInputValue] = useState(eventToEdit.warningThresholdInDays);
    const resetWarningThresholdInputValue = () =>
        setWarningThresholdInputValue(EVENT_DEFAULT_VALUES.warningThresholdInDays);

    const dismissForm = () => {
        resetEventNameInputValue();
        resetWarningThresholdInputValue();
        onDismiss();
    };

    let textFieldErrorProps: { error?: boolean; helperText?: string } = {};
    if (eventNameIsTooLong) {
        textFieldErrorProps = {
            error: true,
            helperText: 'Event name is too long'
        };
    } else if (eventNameAlreadyExists) {
        textFieldErrorProps = {
            error: true,
            helperText: 'That event name already exists'
        };
    }

    const handleEventNameInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        setEventNameInputValue(event.currentTarget.value);
    };

    const handleWarningThresholdInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const newValue = Number(event.currentTarget.value);
        if (newValue >= 0) {
            setWarningThresholdInputValue(newValue);
        }
    };

    const handleNewEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            addLoggableEvent(eventNameInputValue, warningThresholdInputValue);
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            updateLoggableEvent({
                ...eventToEdit,
                name: eventNameInputValue,
                warningThresholdInDays: warningThresholdInputValue
            });
            dismissForm();
        }
    };

    return (
        <ClickAwayListener onClickAway={dismissForm}>
            <Box component="form" onSubmit={eventIdToEdit ? handleUpdateEventSubmit : handleNewEventSubmit}>
                <EventCard
                    css={css`
                        background-color: ${colors.blueGrey[50]};
                    `}
                >
                    <CardContent>
                        <TextField
                            autoFocus
                            id="new-event-input"
                            label="Event name"
                            {...textFieldErrorProps}
                            value={eventNameInputValue}
                            onChange={handleEventNameInputChange}
                            fullWidth
                            variant="standard"
                            margin="normal"
                        />
                        <TextField
                            id="new-event-input"
                            label="Warning threshold"
                            helperText="Show warning when last update has been this many days long. Set to 0 to disable warning."
                            type="number"
                            fullWidth
                            variant="standard"
                            margin="normal"
                            value={warningThresholdInputValue}
                            onChange={handleWarningThresholdInputChange}
                        />
                    </CardContent>
                    <CardActions>
                        <Button disabled={!eventNameIsValid} type="submit" size="small">
                            {eventIdToEdit ? 'Update' : 'Create'}
                        </Button>
                        <Button onClick={dismissForm} size="small">
                            Cancel
                        </Button>
                    </CardActions>
                </EventCard>
            </Box>
        </ClickAwayListener>
    );
};

export default EditEventCard;
