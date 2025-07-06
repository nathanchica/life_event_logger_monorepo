import { createMockEventLabel } from '../../mocks/eventLabels';
import { createMockLoggableEvent } from '../../mocks/loggableEvent';
import {
    validateEventLabelName,
    validateEventName,
    isEventNameValid,
    getEventNameValidationErrorText,
    MAX_LABEL_LENGTH,
    MAX_EVENT_NAME_LENGTH
} from '../validation';

describe('validation', () => {
    describe('validateEventLabelName', () => {
        const mockEventLabels = [
            createMockEventLabel({ id: 'label-1', name: 'Work' }),
            createMockEventLabel({ id: 'label-2', name: 'Personal' }),
            createMockEventLabel({ id: 'label-3', name: 'Health' })
        ];

        it.each([
            ['valid label name', 'New Label', null],
            ['empty string', '', 'EmptyName'],
            ['whitespace-only string', '   ', 'EmptyName'],
            ['name at max length', 'a'.repeat(MAX_LABEL_LENGTH), null],
            ['name exceeding max length', 'a'.repeat(MAX_LABEL_LENGTH + 1), 'TooLongName'],
            ['exact duplicate', 'Work', 'DuplicateName'],
            ['case-insensitive duplicate', 'work', 'DuplicateName'],
            ['uppercase duplicate', 'WORK', 'DuplicateName'],
            ['duplicate with whitespace', ' Work ', 'DuplicateName'],
            ['special characters', 'Work-2023!', null]
        ])('returns correct result for %s', (_, name, expected) => {
            const result = validateEventLabelName(name, mockEventLabels);
            expect(result).toBe(expected);
        });

        it('returns null for empty event labels array', () => {
            const result = validateEventLabelName('New Label', []);
            expect(result).toBeNull();
        });
    });

    describe('validateEventName', () => {
        const mockLoggableEvents = [
            createMockLoggableEvent({ id: 'event-1', name: 'Exercise' }),
            createMockLoggableEvent({ id: 'event-2', name: 'Study' }),
            createMockLoggableEvent({ id: 'event-3', name: 'Sleep' })
        ];

        it.each([
            ['valid event name', 'New Event', undefined, null],
            ['empty string', '', undefined, 'EmptyName'],
            ['whitespace-only string', '   ', undefined, 'EmptyName'],
            ['name at max length', 'a'.repeat(MAX_EVENT_NAME_LENGTH), undefined, null],
            ['name exceeding max length', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), undefined, 'TooLongName'],
            ['exact duplicate', 'Exercise', undefined, 'DuplicateName'],
            ['special characters', 'Exercise-2023!', undefined, null],
            ['editing existing event with same name', 'Exercise', 'event-1', null],
            ['editing event with different existing name', 'Study', 'event-1', 'DuplicateName']
        ])('returns correct result for %s', (_, name, eventIdToEdit, expected) => {
            const result = validateEventName(name, mockLoggableEvents, eventIdToEdit);
            expect(result).toBe(expected);
        });

        it('returns null for empty events array', () => {
            const result = validateEventName('New Event', []);
            expect(result).toBeNull();
        });
    });

    describe('isEventNameValid', () => {
        const mockLoggableEvents = [
            createMockLoggableEvent({ id: 'event-1', name: 'Exercise' }),
            createMockLoggableEvent({ id: 'event-2', name: 'Study' })
        ];

        it.each([
            ['valid event name', 'New Event', undefined, true],
            ['empty event name', '', undefined, false],
            ['duplicate event name', 'Exercise', undefined, false],
            ['too long event name', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), undefined, false],
            ['editing existing event with same name', 'Exercise', 'event-1', true]
        ])('returns %s for %s', (_, name, eventIdToEdit, expected) => {
            const result = isEventNameValid(name, mockLoggableEvents, eventIdToEdit);
            expect(result).toBe(expected);
        });
    });

    describe('getEventNameValidationErrorText', () => {
        const mockLoggableEvents = [
            createMockLoggableEvent({ id: 'event-1', name: 'Exercise' }),
            createMockLoggableEvent({ id: 'event-2', name: 'Study' })
        ];

        it.each([
            ['valid event name', 'New Event', undefined, null],
            ['empty name', '', undefined, 'Event name is required'],
            ['whitespace-only name', '   ', undefined, 'Event name is required'],
            ['too long name', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), undefined, 'Event name is too long'],
            ['duplicate name', 'Exercise', undefined, 'That event name already exists'],
            ['editing existing event with same name', 'Exercise', 'event-1', null]
        ])('returns correct error text for %s', (_, name, eventIdToEdit, expected) => {
            const result = getEventNameValidationErrorText(name, mockLoggableEvents, eventIdToEdit);
            expect(result).toBe(expected);
        });
    });
});
