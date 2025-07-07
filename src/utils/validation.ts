// Validation utilities

// No imports needed - validation functions work with primitive types

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
 * @param existingLabelNames The list of existing event label names
 * @returns EventLabelNameValidationError if invalid, or null if valid
 */
export function validateEventLabelName(
    name: string,
    existingLabelNames: Array<string>
): EventLabelNameValidationError | null {
    if (name.trim() === '') {
        return EventLabelNameValidationError.EmptyName;
    }
    if (name.length > MAX_LABEL_LENGTH) {
        return EventLabelNameValidationError.TooLongName;
    }
    if (existingLabelNames.some((labelName) => labelName.trim().toLowerCase() === name.trim().toLowerCase())) {
        return EventLabelNameValidationError.DuplicateName;
    }
    return null;
}

/**
 * Validates an event name against constraints: non-empty, max length, uniqueness.
 * @param name The event name to validate
 * @param existingEventNames The list of existing event names
 * @returns EventNameValidationError if invalid, or null if valid
 */
export function validateEventName(name: string, existingEventNames: Array<string>): EventNameValidationError | null {
    if (name.trim() === '') {
        return EventNameValidationError.EmptyName;
    }
    if (name.length > MAX_EVENT_NAME_LENGTH) {
        return EventNameValidationError.TooLongName;
    }
    if (existingEventNames.some((eventName) => eventName === name)) {
        return EventNameValidationError.DuplicateName;
    }
    return null;
}

/**
 * Checks if an event name is valid
 * @param name The event name to validate
 * @param existingEventNames The list of existing event names
 * @returns true if valid, false otherwise
 */
export function isEventNameValid(name: string, existingEventNames: Array<string>): boolean {
    return validateEventName(name, existingEventNames) === null;
}

/**
 * Gets validation error message for event name
 * @param name The event name to validate
 * @param existingEventNames The list of existing event names
 * @returns Error message string or null if valid
 */
export function getEventNameValidationErrorText(name: string, existingEventNames: Array<string>): string | null {
    const error = validateEventName(name, existingEventNames);
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
