/** @jsxImportSource @emotion/react */

import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

import { css } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { blueGrey } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import invariant from 'tiny-invariant';

import EventCard from './EventCard';
import EventLabelAutocomplete from './EventLabelAutocomplete';
import { createLoggableEventFromFragment } from './LoggableEventCard';
import WarningThresholdForm from './WarningThresholdForm';

import { useLoggableEvents } from '../../hooks/useLoggableEvents';
import { useLoggableEventsForUser } from '../../hooks/useLoggableEventsForUser';
import { useAuth } from '../../providers/AuthProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { EventLabel, LoggableEvent } from '../../utils/types';
import { isEventNameValid, getEventNameValidationErrorText } from '../../utils/validation';
import { createEventLabelFromFragment } from '../EventLabels/EventLabel';

const EVENT_DEFAULT_VALUES: LoggableEvent = {
    id: '',
    name: '',
    warningThresholdInDays: 0,
    labelIds: [],
    isSynced: false,
    createdAt: new Date(),
    timestamps: []
};

type Props = {
    onDismiss: () => void;
    eventIdToEdit?: string;
};

/**
 * EditEventCard component for editing an existing event or creating a new one.
 *
 * It allows users to change the event name and set a warning threshold.
 *
 * It includes validation for the event name and warning threshold.
 *
 * It displays a form with input fields for the event name and warning threshold,
 * and buttons to submit or cancel the changes.
 */
const EditEventCard = ({ onDismiss, eventIdToEdit }: Props) => {
    const { user } = useAuth();
    const theme = useTheme();
    const { createLoggableEvent, updateLoggableEvent, createIsLoading, updateIsLoading } = useLoggableEvents();
    const { activeEventLabelId } = useViewOptions();

    invariant(user, 'User is not authenticated');

    const { loggableEventsFragments, eventLabelsFragments } = useLoggableEventsForUser(user);

    const loggableEvents = loggableEventsFragments.map(createLoggableEventFromFragment);
    const eventLabels = eventLabelsFragments.map(createEventLabelFromFragment);

    const existingEventNames = loggableEvents.map((event) => event.name);
    const eventToEdit = loggableEvents.find(({ id }) => id === eventIdToEdit) || EVENT_DEFAULT_VALUES;
    const isCreatingNewEvent = !eventIdToEdit;

    /** Event name */
    const [eventNameInputValue, setEventNameInputValue] = useState(eventToEdit.name);
    const resetEventNameInputValue = () => setEventNameInputValue(EVENT_DEFAULT_VALUES.name);

    const shouldValidate = eventNameInputValue !== eventToEdit.name;
    const eventNameIsValid = shouldValidate ? isEventNameValid(eventNameInputValue, existingEventNames) : true;

    /** Event name validation error display */
    const validationErrorText = shouldValidate
        ? getEventNameValidationErrorText(eventNameInputValue, existingEventNames)
        : null;
    const textFieldErrorProps: { error?: boolean; helperText?: string } = validationErrorText
        ? {
              error: true,
              helperText: validationErrorText
          }
        : {};

    /**
     * Warning threshold.
     * Default to disabled. Initialize as enabled if the event being edited has an existing value
     */
    const [warningIsEnabled, setWarningIsEnabled] = useState(
        eventIdToEdit ? eventToEdit.warningThresholdInDays > 0 : false
    );
    const defaultWarningThreshold = isCreatingNewEvent
        ? EVENT_DEFAULT_VALUES.warningThresholdInDays
        : eventToEdit.warningThresholdInDays;
    const [warningThresholdInDays, setWarningThresholdInDays] = useState(defaultWarningThreshold);
    const resetWarningThresholdInputValue = () => setWarningThresholdInDays(defaultWarningThreshold);
    const warningThresholdValueToSave = warningIsEnabled ? warningThresholdInDays : 0;

    /**
     * Labels
     * If creating a new event, pre-populate with the active event label if it exists.
     * If editing an existing event, pre-populate with existing labels from the event being edited.
     */
    const activeEventLabel = activeEventLabelId ? eventLabels.find(({ id }) => id === activeEventLabelId) : undefined;
    const [labelInputIsVisible, setLabelInputIsVisible] = useState(
        isCreatingNewEvent ? Boolean(activeEventLabelId) : eventToEdit.labelIds && eventToEdit.labelIds.length > 0
    );
    const [selectedLabels, setSelectedLabels] = useState<EventLabel[]>(() => {
        if (isCreatingNewEvent && activeEventLabel) {
            return [activeEventLabel];
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

    const handleWarningThresholdChange = (thresholdInDays: number) => {
        setWarningThresholdInDays(thresholdInDays);
    };

    const handleWarningToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setWarningIsEnabled(event.target.checked);
    };

    /** Save handlers */
    const formValues = {
        name: eventNameInputValue,
        warningThresholdInDays: warningThresholdValueToSave,
        labelIds: selectedLabels.map(({ id }) => id)
    };

    const handleNewEventSubmit = async (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            await createLoggableEvent(formValues.name, formValues.warningThresholdInDays, formValues.labelIds);
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = async (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid && eventIdToEdit) {
            await updateLoggableEvent(eventIdToEdit, formValues);
            dismissForm();
        }
    };

    return (
        <ClickAwayListener onClickAway={dismissForm} mouseEvent="onMouseDown" touchEvent="onTouchStart">
            <Box
                component="form"
                onSubmit={eventIdToEdit ? handleUpdateEventSubmit : handleNewEventSubmit}
                role="form"
                aria-label={isCreatingNewEvent ? 'Create new event' : 'Edit event'}
            >
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
                            aria-required="true"
                            aria-invalid={!eventNameIsValid}
                            aria-describedby={textFieldErrorProps.error ? 'event-name-error' : undefined}
                        />

                        {/* Warning threshold */}
                        <Box aria-describedby="warning-switch-description">
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={warningIsEnabled}
                                            onChange={handleWarningToggleChange}
                                            aria-describedby="warning-switch-description"
                                        />
                                    }
                                    label="Enable warning"
                                />
                            </FormGroup>
                            <Typography id="warning-switch-description" sx={visuallyHidden}>
                                Toggle to enable warning notifications for this event
                            </Typography>
                        </Box>
                        <Collapse in={warningIsEnabled}>
                            <WarningThresholdForm
                                onChange={handleWarningThresholdChange}
                                initialThresholdInDays={defaultWarningThreshold}
                            />
                        </Collapse>

                        {/* Labels */}
                        {!labelInputIsVisible ? (
                            <Button
                                variant="text"
                                size="small"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={() => setLabelInputIsVisible(true)}
                                aria-describedby="labels-section-description"
                            >
                                Add labels
                            </Button>
                        ) : (
                            <Box aria-labelledby="labels-section-label">
                                <Typography id="labels-section-label" sx={visuallyHidden}>
                                    Event labels
                                </Typography>
                                <EventLabelAutocomplete
                                    selectedLabels={selectedLabels}
                                    setSelectedLabels={setSelectedLabels}
                                    existingLabels={eventLabels}
                                />
                            </Box>
                        )}
                        <Typography id="labels-section-description" sx={visuallyHidden}>
                            Add labels to categorize and organize your events
                        </Typography>
                    </CardContent>

                    <CardActions>
                        <Button
                            disabled={!eventNameIsValid || createIsLoading || updateIsLoading}
                            type="submit"
                            size="small"
                            aria-describedby={!eventNameIsValid ? 'submit-button-disabled-reason' : undefined}
                        >
                            {eventIdToEdit ? 'Update' : 'Create'}
                        </Button>
                        <Button onClick={dismissForm} size="small" aria-label="Cancel and close form">
                            Cancel
                        </Button>
                        {!eventNameIsValid && (
                            <Typography id="submit-button-disabled-reason" sx={visuallyHidden}>
                                Submit button is disabled because the event name is invalid
                            </Typography>
                        )}
                    </CardActions>
                </EventCard>
            </Box>
        </ClickAwayListener>
    );
};

export default EditEventCard;
