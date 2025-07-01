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
import EventLabelAutocomplete from './EventLabelAutocomplete';
import { useLoggableEventsContext, EventLabel, EVENT_DEFAULT_VALUES } from '../../providers/LoggableEventsProvider';
import { useComponentDisplayContext } from '../../providers/ComponentDisplayProvider';

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

/**
 * EditEventCard component for editing an existing event.
 *
 * It allows users to change the event name and set a warning threshold.
 *
 * It also provides a form to create a new event if no eventIdToEdit is provided.
 *
 * It includes validation for the event name and warning threshold.
 *
 * It displays a form with input fields for the event name and warning threshold,
 * and buttons to submit or cancel the changes.
 */
const EditEventCard = ({ onDismiss, eventIdToEdit }: Props) => {
    /** Context */
    const { loggableEvents, createLoggableEvent, updateLoggableEventDetails, eventLabels } = useLoggableEventsContext();
    const { activeEventLabelId } = useComponentDisplayContext();

    const theme = useTheme();

    const eventToEdit = loggableEvents.find(({ id }) => id === eventIdToEdit) || EVENT_DEFAULT_VALUES;
    const isCreatingNewEvent = !eventIdToEdit;

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

    /**
     * Labels
     */
    const activeLabelObj = activeEventLabelId ? eventLabels.find((l) => l.id === activeEventLabelId) : undefined;
    const [showLabelInput, setShowLabelInput] = useState(
        isCreatingNewEvent ? Boolean(activeEventLabelId) : eventToEdit.labelIds && eventToEdit.labelIds.length > 0
    );
    const [selectedLabels, setSelectedLabels] = useState<EventLabel[]>(() => {
        if (isCreatingNewEvent && activeLabelObj) {
            return [activeLabelObj];
        }
        // If editing, pre-populate with existing labels
        return eventToEdit.labelIds ? eventLabels.filter(({ id }) => eventToEdit.labelIds.includes(id)) : [];
    });

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
            createLoggableEvent(
                eventNameInputValue,
                warningThresholdValueToSave,
                selectedLabels.map(({ id }) => id)
            );
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            updateLoggableEventDetails({
                ...eventToEdit,
                name: eventNameInputValue,
                warningThresholdInDays: warningThresholdValueToSave,
                labelIds: selectedLabels.map(({ id }) => id)
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
                        {/* Event name */}
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

                        {/* Warning threshold */}
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

                        {/* Labels */}
                        {!showLabelInput ? (
                            <Button
                                variant="text"
                                size="small"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={() => setShowLabelInput(true)}
                            >
                                Add labels
                            </Button>
                        ) : (
                            <EventLabelAutocomplete
                                selectedLabels={selectedLabels}
                                setSelectedLabels={setSelectedLabels}
                            />
                        )}
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
