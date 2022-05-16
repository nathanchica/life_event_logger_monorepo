import { useState, ChangeEventHandler, SyntheticEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/AddRounded';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';

export const MAX_LENGTH = 25;

const CreateEventForm = () => {
    const { loggableEvents, addLoggableEvent } = useLoggableEventsContext();

    const [newEventInputValue, setNewEventInputValue] = useState('');
    const clearNewEventInputValue = () => setNewEventInputValue('');
    const newInputValueIsTooLong = newEventInputValue.length > MAX_LENGTH;
    const newEventInputValueAlreadyExists = Boolean(loggableEvents.find(({ name }) => name === newEventInputValue));

    const handleNewEventInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        setNewEventInputValue(event.currentTarget.value);
    };

    const handleNewEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (
            newEventInputValue.length > 0 &&
            newEventInputValue.length <= MAX_LENGTH &&
            !newEventInputValueAlreadyExists
        ) {
            addLoggableEvent(newEventInputValue);
            clearNewEventInputValue();
        }
    };

    let textFieldErrorProps: { error?: boolean; helperText?: string } = {};
    if (newInputValueIsTooLong) {
        textFieldErrorProps = {
            error: true,
            helperText: 'Event name is too long'
        };
    } else if (newEventInputValueAlreadyExists) {
        textFieldErrorProps = {
            error: true,
            helperText: 'That event name already exists'
        };
    }

    return (
        <form onSubmit={handleNewEventSubmit}>
            <Tooltip open={loggableEvents.length === 0} title="Register your first event!" arrow>
                <TextField
                    id="new-event-input"
                    label="Register a new event"
                    value={newEventInputValue}
                    {...textFieldErrorProps}
                    onChange={handleNewEventInputChange}
                    margin="normal"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    disabled={newEventInputValue.length === 0 || textFieldErrorProps?.error}
                                    size="large"
                                    color="primary"
                                    type="submit">
                                    <AddIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    css={css`
                        margin-right: 16px;
                    `}
                />
            </Tooltip>
        </form>
    );
};

export default CreateEventForm;
