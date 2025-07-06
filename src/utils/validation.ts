// Validation utilities

import { EventLabel, LoggableEvent } from '../utils/types';

enum EventLabelNameValidationError {
    EmptyName = 'EmptyName',
    /** The event label name is too long */
    TooLongName = 'TooLongName',
    /** The event label name already exists */
    DuplicateName = 'DuplicateName'
}

export const MAX_LABEL_LENGTH = 24;
export const MAX_EVENT_NAME_LENGTH = 24;

enum EventNameValidationError {
    EmptyName = 'EmptyName',
    /** The event name is too long */
    TooLongName = 'TooLongName',
    /** The event name already exists */
    DuplicateName = 'DuplicateName'
}

/**
 * Validates an event label name against constraints: non-empty, max length, uniqueness.
 * @param name The label name to validate
 * @param eventLabels The list of existing event labels
 * @returns EventLabelNameValidationError if invalid, or null if valid
 */
export function validateEventLabelName(
    name: string,
    eventLabels: Array<EventLabel>
): EventLabelNameValidationError | null {
    if (name.trim() === '') {
        return EventLabelNameValidationError.EmptyName;
    }
    if (name.length > MAX_LABEL_LENGTH) {
        return EventLabelNameValidationError.TooLongName;
    }
    if (eventLabels.some((label) => label.name.trim().toLowerCase() === name.trim().toLowerCase())) {
        return EventLabelNameValidationError.DuplicateName;
    }
    return null;
}

/**
 * Validates an event name against constraints: non-empty, max length, uniqueness.
 * @param name The event name to validate
 * @param loggableEvents The list of existing loggable events
 * @param eventIdToEdit Optional ID of the event being edited (excludes it from duplicate check)
 * @returns EventNameValidationError if invalid, or null if valid
 */
export function validateEventName(
    name: string,
    loggableEvents: Array<LoggableEvent>,
    eventIdToEdit?: string
): EventNameValidationError | null {
    if (name.trim() === '') {
        return EventNameValidationError.EmptyName;
    }
    if (name.length > MAX_EVENT_NAME_LENGTH) {
        return EventNameValidationError.TooLongName;
    }
    if (loggableEvents.some((event) => event.id !== eventIdToEdit && event.name === name)) {
        return EventNameValidationError.DuplicateName;
    }
    return null;
}

/**
 * Checks if an event name is valid
 * @param name The event name to validate
 * @param loggableEvents The list of existing loggable events
 * @param eventIdToEdit Optional ID of the event being edited (excludes it from duplicate check)
 * @returns true if valid, false otherwise
 */
export function isEventNameValid(name: string, loggableEvents: Array<LoggableEvent>, eventIdToEdit?: string): boolean {
    return validateEventName(name, loggableEvents, eventIdToEdit) === null;
}

/**
 * Gets validation error message for event name
 * @param name The event name to validate
 * @param loggableEvents The list of existing loggable events
 * @param eventIdToEdit Optional ID of the event being edited (excludes it from duplicate check)
 * @returns Error message string or null if valid
 */
export function getEventNameValidationErrorText(
    name: string,
    loggableEvents: Array<LoggableEvent>,
    eventIdToEdit?: string
): string | null {
    const error = validateEventName(name, loggableEvents, eventIdToEdit);
    switch (error) {
        case EventNameValidationError.EmptyName:
            return 'Event name is required';
        case EventNameValidationError.TooLongName:
            return 'Event name is too long';
        case EventNameValidationError.DuplicateName:
            return 'That event name already exists';
        default:
            return null;
    }
}
