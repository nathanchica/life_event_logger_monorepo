import { useState, ChangeEventHandler, SyntheticEvent } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';

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
            <Grid container alignItems="center">
                <Grid item xs={10}>
                    <Tooltip open={loggableEvents.length === 0} title="Register your first event!" arrow>
                        <TextField
                            id="new-event-input"
                            label="Register a new event"
                            {...textFieldErrorProps}
                            value={newEventInputValue}
                            onChange={handleNewEventInputChange}
                            margin="dense"
                            size="small"
                            fullWidth
                        />
                    </Tooltip>
                </Grid>
                <Grid item xs={2}>
                    <Button
                        disabled={newEventInputValue.length === 0 || textFieldErrorProps?.error}
                        type="submit"
                        size="large"
                    >
                        Add
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
};

export default CreateEventForm;
