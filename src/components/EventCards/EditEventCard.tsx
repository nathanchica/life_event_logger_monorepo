import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import blueGrey from '@mui/material/colors/blueGrey';
import { useTheme } from '@mui/material/styles';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EventCard from './EventCard';
import { useLoggableEventsContext, EVENT_DEFAULT_VALUES } from '../../providers/LoggableEventsProvider';

export const MAX_LENGTH = 25;
export const MAX_WARNING_THRESHOLD_DAYS = 365 * 2; // 2 years

type Props = {
    onDismiss: () => void;
    eventIdToEdit?: string;
};

const WarningSwitch = ({ checked, onChange }: { checked: boolean; onChange: (newCheckedValue: boolean) => void }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.checked);
    };

    return (
        <FormGroup>
            <FormControlLabel control={<Switch checked={checked} onChange={handleChange} />} label="Enable warning" />
        </FormGroup>
    );
};

const EditEventCard = ({ onDismiss, eventIdToEdit }: Props) => {
    /** Context */
    const { loggableEvents, createLoggableEvent, updateLoggableEventDetails } = useLoggableEventsContext();
    const theme = useTheme();

    const eventToEdit = loggableEvents.find(({ id }) => id === eventIdToEdit) || EVENT_DEFAULT_VALUES;

    /** Event name */
    const [eventNameInputValue, setEventNameInputValue] = useState(eventToEdit.name);
    const resetEventNameInputValue = () => setEventNameInputValue(EVENT_DEFAULT_VALUES.name);
    const eventNameIsTooLong = eventNameInputValue.length > MAX_LENGTH;
    const eventNameAlreadyExists = Boolean(
        loggableEvents.find(({ id, name }) => id !== eventIdToEdit && name === eventNameInputValue)
    );
    const eventNameIsValid =
        eventNameInputValue.length > 0 && eventNameInputValue.length <= MAX_LENGTH && !eventNameAlreadyExists;

    /** Event name validation error display */
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

    /**
     * Warning threshold.
     * Default to disabled. Initialize as enabled if the event being edited has an existing value
     */
    const [warningIsEnabled, setWarningIsEnabled] = useState(
        eventIdToEdit ? eventToEdit.warningThresholdInDays > 0 : false
    );
    const [warningThresholdInputValue, setWarningThresholdInputValue] = useState(eventToEdit.warningThresholdInDays);
    const resetWarningThresholdInputValue = () =>
        setWarningThresholdInputValue(EVENT_DEFAULT_VALUES.warningThresholdInDays);
    const warningThresholdValueToSave = warningIsEnabled ? warningThresholdInputValue : 0;

    /** Handlers */
    const dismissForm = () => {
        resetEventNameInputValue();
        resetWarningThresholdInputValue();
        onDismiss();
    };

    const handleEventNameInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        setEventNameInputValue(event.currentTarget.value);
    };

    const handleWarningThresholdInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const newValue = Number(event.currentTarget.value);
        if (newValue >= 0 && newValue < MAX_WARNING_THRESHOLD_DAYS) {
            setWarningThresholdInputValue(newValue);
        }
    };

    const handleWarningToggleChange = (newCheckedValue: boolean) => {
        setWarningIsEnabled(newCheckedValue);
    };

    /** Save handlers */
    const handleNewEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            createLoggableEvent(eventNameInputValue, warningThresholdValueToSave, []);
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            updateLoggableEventDetails({
                ...eventToEdit,
                name: eventNameInputValue,
                warningThresholdInDays: warningThresholdValueToSave
            });
            dismissForm();
        }
    };

    return (
        <ClickAwayListener onClickAway={dismissForm}>
            <Box component="form" onSubmit={eventIdToEdit ? handleUpdateEventSubmit : handleNewEventSubmit}>
                <EventCard
                    css={css`
                        background-color: ${theme.palette.mode === 'dark' ? blueGrey[900] : blueGrey[50]};
                    `}
                >
                    <CardContent>
                        <TextField
                            autoComplete="off"
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
                        <WarningSwitch checked={warningIsEnabled} onChange={handleWarningToggleChange} />
                        <Collapse in={warningIsEnabled}>
                            <TextField
                                id="warning-threshold-input"
                                label="Warning threshold"
                                helperText="Show warning when last update has been this many days long. Between 1 and 730 (2 years)."
                                type="number"
                                fullWidth
                                variant="standard"
                                margin="normal"
                                value={warningThresholdInputValue}
                                onChange={handleWarningThresholdInputChange}
                            />
                        </Collapse>
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
