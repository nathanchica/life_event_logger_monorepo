/** @jsxImportSource @emotion/react */

import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

import { gql, useFragment } from '@apollo/client';
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
import WarningThresholdForm from './WarningThresholdForm';

import { useLoggableEvents } from '../../hooks/useLoggableEvents';
import { useAuth } from '../../providers/AuthProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { EventLabel, LoggableEvent } from '../../utils/types';
import { isEventNameValid, getEventNameValidationErrorText } from '../../utils/validation';

type EventLabelFragment = {
    id: string;
    name: string;
};
interface LoggableEventCoreFragment {
    id: string;
    name: string;
}

type LoggableEventFullFragment = LoggableEventCoreFragment & {
    timestamps: string[];
    warningThresholdInDays: number;
    labels: Array<EventLabelFragment>;
};

const USER_LABELS_AND_EVENTS_FRAGMENT = gql`
    fragment UserLabelsAndEventsFragment on User {
        loggableEvents {
            id
            name
        }
        eventLabels {
            id
            name
        }
    }
`;

const EDIT_EVENT_CARD_FRAGMENT = gql`
    fragment EditEventCardFragment on LoggableEvent {
        id
        name
        timestamps
        warningThresholdInDays
        labels {
            id
            name
        }
    }
`;

const createCoreLoggableEventFromFragment = ({ id, name }: LoggableEventCoreFragment): LoggableEventCoreFragment => {
    return {
        id,
        name
    };
};

const createLoggableEventFromFragment = ({
    id,
    name,
    timestamps,
    warningThresholdInDays,
    labels
}: LoggableEventFullFragment): LoggableEvent => {
    return {
        id,
        name,
        timestamps: timestamps.map((timestampIsoString) => new Date(timestampIsoString)),
        warningThresholdInDays,
        labelIds: labels.map(({ id }) => id)
    };
};

const createEventLabelFromFragment = ({ id, name }: EventLabelFragment): EventLabel => {
    return {
        id,
        name
    };
};

const EVENT_DEFAULT_VALUES: LoggableEvent = {
    id: '',
    name: '',
    warningThresholdInDays: 0,
    labelIds: [],
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
    const { createLoggableEvent, updateLoggableEvent } = useLoggableEvents();
    const { activeEventLabelId } = useViewOptions();

    invariant(user, 'User is not authenticated');

    const isDarkMode = theme.palette.mode === 'dark';
    const isCreatingNewEvent = !eventIdToEdit;

    /**
     * Fetch all user labels and events (only ids and names of each) for validation purposes
     */
    const { data: userLabelsAndEventsData } = useFragment({
        fragment: USER_LABELS_AND_EVENTS_FRAGMENT,
        fragmentName: 'UserLabelsAndEventsFragment',
        from: {
            __typename: 'User',
            id: user.id
        }
    });
    /**
     * Fetch the full loggable event data if editing an existing event.
     * If creating a new event, this will be undefined and the default values will be used.
     */
    const { data: loggableEventData } = useFragment({
        fragment: EDIT_EVENT_CARD_FRAGMENT,
        fragmentName: 'EditEventCardFragment',
        from: {
            __typename: 'LoggableEvent',
            // if creating a new event, use a placeholder id to avoid console warning. won't be used in mutation
            id: isCreatingNewEvent ? 'placeholder-new-event' : eventIdToEdit
        }
    });

    const allEventLabels: Array<EventLabel> = userLabelsAndEventsData.eventLabels.map(createEventLabelFromFragment);
    const allLoggableEvents: Array<LoggableEvent> = userLabelsAndEventsData.loggableEvents.map(
        createCoreLoggableEventFromFragment
    );
    const existingEventNames: Array<string> = allLoggableEvents.map(({ name }) => name);

    const eventToEdit = !isCreatingNewEvent ? createLoggableEventFromFragment(loggableEventData) : EVENT_DEFAULT_VALUES;

    /** Event name */
    const [eventNameInputValue, setEventNameInputValue] = useState(eventToEdit.name);
    const resetEventNameInputValue = () => setEventNameInputValue(EVENT_DEFAULT_VALUES.name);

    const shouldValidateEventName = eventNameInputValue !== eventToEdit.name;
    const eventNameIsValid = shouldValidateEventName ? isEventNameValid(eventNameInputValue, existingEventNames) : true;

    /** Event name validation error display */
    const validationErrorText = shouldValidateEventName
        ? getEventNameValidationErrorText(eventNameInputValue, existingEventNames)
        : null;
    const textFieldErrorProps: { error?: boolean; helperText?: string } = validationErrorText
        ? {
              error: true,
              helperText: validationErrorText
          }
        : {};

    const submitButtonIsDisabled = !eventNameIsValid || eventNameInputValue.trim() === '';

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
    const activeEventLabel = activeEventLabelId
        ? allEventLabels.find(({ id }) => id === activeEventLabelId)
        : undefined;
    const [labelInputIsVisible, setLabelInputIsVisible] = useState(
        isCreatingNewEvent ? Boolean(activeEventLabelId) : eventToEdit.labelIds && eventToEdit.labelIds.length > 0
    );
    const [selectedLabels, setSelectedLabels] = useState<EventLabel[]>(() => {
        if (isCreatingNewEvent && activeEventLabel) {
            return [activeEventLabel];
        }
        // pre-populate with existing labels
        return allEventLabels.filter(({ id }) => eventToEdit.labelIds.includes(id));
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

    const handleNewEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        // safety check, the form won't call this handler if the event name is invalid so ignoring coverage for else
        /* istanbul ignore else */
        if (eventNameIsValid) {
            createLoggableEvent({
                input: {
                    name: formValues.name,
                    warningThresholdInDays: formValues.warningThresholdInDays,
                    labelIds: formValues.labelIds
                }
            });
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        // safety check, the form won't call this handler if the event name is invalid so ignoring coverage for else
        /* istanbul ignore else */
        if (eventNameIsValid && eventIdToEdit) {
            updateLoggableEvent({
                input: {
                    id: eventIdToEdit,
                    ...formValues
                }
            });
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
                        background-color: ${isDarkMode ? blueGrey[900] : blueGrey[50]};
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
                            color={isDarkMode ? 'primary' : 'secondary'}
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
                                color={isDarkMode ? 'primary' : 'secondary'}
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
                                    existingLabels={allEventLabels}
                                />
                            </Box>
                        )}
                        <Typography id="labels-section-description" sx={visuallyHidden}>
                            Add labels to categorize and organize your events
                        </Typography>
                    </CardContent>

                    <CardActions>
                        <Button
                            disabled={submitButtonIsDisabled}
                            type="submit"
                            size="small"
                            aria-describedby={!eventNameIsValid ? 'submit-button-disabled-reason' : undefined}
                            color={isDarkMode ? 'primary' : 'secondary'}
                        >
                            {eventIdToEdit ? 'Update' : 'Create'}
                        </Button>
                        <Button
                            onClick={dismissForm}
                            size="small"
                            aria-label="Cancel and close form"
                            color={isDarkMode ? 'primary' : 'secondary'}
                        >
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

EditEventCard.fragments = {
    loggableEvent: EDIT_EVENT_CARD_FRAGMENT,
    userLabelsAndEvents: USER_LABELS_AND_EVENTS_FRAGMENT
};

export default EditEventCard;
