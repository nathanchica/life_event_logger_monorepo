// Validation utilities

import { EventLabel } from '../utils/types';

export enum EventLabelNameValidationError {
    EmptyName = 'EmptyName',
    /** The event label name is too long */
    TooLongName = 'TooLongName',
    /** The event label name already exists */
    DuplicateName = 'DuplicateName'
}

export const MAX_LABEL_LENGTH = 24;

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
