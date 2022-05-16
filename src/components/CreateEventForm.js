import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';

export const MAX_LENGTH = 25;

const CreateEventForm = () => {
    const { addLoggableEvent } = useLoggableEventsContext();
    const [newEventInputValue, setNewEventInputValue] = useState('');
    const clearNewEventInputValue = () => setNewEventInputValue('');

    const handleNewEventInputChange = (event) => {
        setNewEventInputValue(event.currentTarget.value);
    };

    const handleNewEventSubmit = (event) => {
        event.preventDefault();
        if (newEventInputValue.length > 0 && newEventInputValue.length <= MAX_LENGTH) {
            addLoggableEvent(newEventInputValue);
            clearNewEventInputValue();
        }
    };

    const newInputValueIsTooLong = newEventInputValue.length > MAX_LENGTH;

    return (
        <form onSubmit={handleNewEventSubmit}>
            <TextField
                id="new-event-input"
                label="Create a new event"
                autoComplete="false"
                value={newEventInputValue}
                error={newInputValueIsTooLong}
                helperText={newInputValueIsTooLong ? 'Event name is too long' : null}
                onChange={handleNewEventInputChange}
                variant="standard"
                margin="normal"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                css={css`
                                    margin-bottom: 16px;
                                `}
                                disabled={newEventInputValue.length === 0 || newInputValueIsTooLong}
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
        </form>
    );
};

export default CreateEventForm;
