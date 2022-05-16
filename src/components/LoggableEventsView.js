import { useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';
import LoggableEventList from './LoggableEventList';

const LoggableEventsView = () => {
    const { addLoggableEvent } = useLoggableEventsContext();
    const [newEventInputValue, setNewEventInputValue] = useState('');
    const clearNewEventInputValue = () => setNewEventInputValue('');

    const handleNewEventInputChange = (event) => {
        setNewEventInputValue(event.currentTarget.value);
    };

    const handleNewEventSubmit = (event) => {
        event.preventDefault();
        if (newEventInputValue.length > 0) {
            addLoggableEvent(newEventInputValue);
            clearNewEventInputValue();
        }
    };

    return (
        <div
            css={css`
                margin: 40px;
            `}>
            <form onSubmit={handleNewEventSubmit}>
                <TextField
                    id="new-event-input"
                    label="Create a new event"
                    value={newEventInputValue}
                    onChange={handleNewEventInputChange}
                    size="small"
                    css={css`
                        margin-right: 16px;
                    `}
                />
                <Button type="submit" variant="contained" endIcon={<AddIcon />}>
                    Create
                </Button>
            </form>

            <div
                css={css`
                    display: block;
                `}>
                <LoggableEventList />
            </div>
        </div>
    );
};

export default LoggableEventsView;
