import {
    validateEventLabelName,
    validateEventName,
    isEventNameValid,
    getEventNameValidationErrorText,
    MAX_LABEL_LENGTH,
    MAX_EVENT_NAME_LENGTH,
    EventLabelNameValidationError,
    EventNameValidationError
} from '../validation';

describe('validation', () => {
    describe('validateEventLabelName', () => {
        const existingLabelNames = ['Work', 'Personal', 'Health'];

        it.each([
            ['valid label name', 'New Label', null],
            ['empty string', '', EventLabelNameValidationError.EmptyName],
            ['whitespace-only string', '   ', EventLabelNameValidationError.EmptyName],
            ['name at max length', 'a'.repeat(MAX_LABEL_LENGTH), null],
            ['name exceeding max length', 'a'.repeat(MAX_LABEL_LENGTH + 1), EventLabelNameValidationError.TooLongName],
            ['exact duplicate', 'Work', EventLabelNameValidationError.DuplicateName],
            ['case-insensitive duplicate', 'work', EventLabelNameValidationError.DuplicateName],
            ['uppercase duplicate', 'WORK', EventLabelNameValidationError.DuplicateName],
            ['duplicate with whitespace', ' Work ', EventLabelNameValidationError.DuplicateName],
            ['special characters', 'Work-2023!', null]
        ])('returns correct result for %s', (_, name, expected) => {
            const result = validateEventLabelName(name, existingLabelNames);
            expect(result).toBe(expected);
        });

        it('returns null for empty event labels array', () => {
            const result = validateEventLabelName('New Label', []);
            expect(result).toBeNull();
        });
    });

    describe('validateEventName', () => {
        const existingEventNames = ['Exercise', 'Study', 'Sleep'];

        it.each([
            ['valid event name', 'New Event', null],
            ['empty string', '', EventNameValidationError.EmptyName],
            ['whitespace-only string', '   ', EventNameValidationError.EmptyName],
            ['name at max length', 'a'.repeat(MAX_EVENT_NAME_LENGTH), null],
            ['name exceeding max length', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), EventNameValidationError.TooLongName],
            ['exact duplicate', 'Exercise', EventNameValidationError.DuplicateName],
            ['special characters', 'Exercise-2023!', null]
        ])('returns correct result for %s', (_, name, expected) => {
            const result = validateEventName(name, existingEventNames);
            expect(result).toBe(expected);
        });

        it('returns null for empty events array', () => {
            const result = validateEventName('New Event', []);
            expect(result).toBeNull();
        });
    });

    describe('isEventNameValid', () => {
        const existingEventNames = ['Exercise', 'Study'];

        it.each([
            ['valid event name', 'New Event', true],
            ['empty event name', '', false],
            ['duplicate event name', 'Exercise', false],
            ['too long event name', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), false]
        ])('returns %s for %s', (_, name, expected) => {
            const result = isEventNameValid(name, existingEventNames);
            expect(result).toBe(expected);
        });
    });

    describe('getEventNameValidationErrorText', () => {
        const existingEventNames = ['Exercise', 'Study'];

        it.each([
            ['valid event name', 'New Event', null],
            ['empty name', '', 'Event name is required'],
            ['whitespace-only name', '   ', 'Event name is required'],
            ['too long name', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), 'Event name is too long'],
            ['duplicate name', 'Exercise', 'That event name already exists']
        ])('returns correct error text for %s', (_, name, expected) => {
            const result = getEventNameValidationErrorText(name, existingEventNames);
            expect(result).toBe(expected);
        });
    });
});
