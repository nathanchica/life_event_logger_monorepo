import {
    getNumberOfDaysBetweenDates,
    sortDateObjectsByNewestFirst,
    convertDaysToUnitAndNumber,
    getDaysSinceLastEventRecord
} from '../time';

describe('getNumberOfDaysBetweenDates', () => {
    it.each([
        ['same date and time', new Date('2023-01-01T10:00:00Z'), new Date('2023-01-01T10:00:00Z'), 0],
        ['same date different times', new Date('2023-01-01T10:00:00Z'), new Date('2023-01-01T22:00:00Z'), 0],
        ['different dates same time', new Date('2023-01-01T10:00:00Z'), new Date('2023-01-02T10:00:00Z'), 1],
        ['different dates less than 24 hours', new Date('2023-01-01T22:00:00Z'), new Date('2023-01-02T10:00:00Z'), 1],
        ['exactly 24 hours apart', new Date('2023-01-01T10:00:00Z'), new Date('2023-01-02T10:00:00Z'), 1],
        ['multiple days apart', new Date('2023-01-01T10:00:00Z'), new Date('2023-01-05T10:00:00Z'), 4],
        ['end date before start date', new Date('2023-01-05T10:00:00Z'), new Date('2023-01-01T10:00:00Z'), -4]
    ])('returns correct days for %s', (_, startDate, endDate, expectedDays) => {
        expect(getNumberOfDaysBetweenDates(startDate, endDate)).toBe(expectedDays);
    });

    it('handles cross-month date differences', () => {
        const startDate = new Date('2023-01-31T10:00:00Z');
        const endDate = new Date('2023-02-01T08:00:00Z');
        expect(getNumberOfDaysBetweenDates(startDate, endDate)).toBe(1);
    });

    it('returns 1 when dates are on different days but are less than 24 hours apart', () => {
        const startDate = new Date('2023-01-01T23:59:00');
        const endDate = new Date('2023-01-02T00:01:00');
        expect(getNumberOfDaysBetweenDates(startDate, endDate)).toBe(1);
    });
});

describe('sortDateObjectsByNewestFirst', () => {
    it('works with array sort method', () => {
        const dates = [new Date('2023-01-01'), new Date('2023-01-03'), new Date('2023-01-02')];

        const sorted = dates.sort(sortDateObjectsByNewestFirst);

        expect(sorted[0]).toEqual(new Date('2023-01-03'));
        expect(sorted[1]).toEqual(new Date('2023-01-02'));
        expect(sorted[2]).toEqual(new Date('2023-01-01'));
    });
});

describe('convertDaysToUnitAndNumber', () => {
    it.each([
        ['0 days', 0, { number: 0, unit: 'days' }],
        ['single day', 1, { number: 1, unit: 'days' }],
        ['29 days', 29, { number: 29, unit: 'days' }],
        ['exactly 30 days', 30, { number: 1, unit: 'months' }],
        ['45 days', 45, { number: 1, unit: 'months' }],
        ['59 days', 59, { number: 1, unit: 'months' }],
        ['60 days', 60, { number: 2, unit: 'months' }],
        ['364 days', 364, { number: 12, unit: 'months' }],
        ['exactly 365 days', 365, { number: 1, unit: 'years' }],
        ['400 days', 400, { number: 1, unit: 'years' }],
        ['730 days', 730, { number: 2, unit: 'years' }],
        ['1000 days', 1000, { number: 2, unit: 'years' }]
    ])('converts %s correctly', (_, days, expected) => {
        expect(convertDaysToUnitAndNumber(days)).toEqual(expected);
    });

    it('uses floor division for partial units', () => {
        expect(convertDaysToUnitAndNumber(394)).toEqual({ number: 1, unit: 'years' });
        expect(convertDaysToUnitAndNumber(729)).toEqual({ number: 1, unit: 'years' });
        expect(convertDaysToUnitAndNumber(89)).toEqual({ number: 2, unit: 'months' });
    });
});

describe('getDaysSinceLastEventRecord', () => {
    const currentDate = new Date('2023-01-10T10:00:00Z');

    it('returns undefined when no event records exist', () => {
        expect(getDaysSinceLastEventRecord([], currentDate)).toBeUndefined();
    });

    it('returns undefined when all events are in the future', () => {
        const futureEvents = [new Date('2023-01-15T10:00:00Z'), new Date('2023-01-20T10:00:00Z')];
        expect(getDaysSinceLastEventRecord(futureEvents, currentDate)).toBeUndefined();
    });

    it('returns 0 for event on current date', () => {
        const events = [new Date('2023-01-10T08:00:00Z')];
        expect(getDaysSinceLastEventRecord(events, currentDate)).toBe(0);
    });

    it('returns correct days for past event', () => {
        const events = [new Date('2023-01-05T10:00:00Z')];
        expect(getDaysSinceLastEventRecord(events, currentDate)).toBe(5);
    });

    it('finds most recent past event from mixed past and future events', () => {
        const events = [
            new Date('2023-01-15T10:00:00Z'), // Future event
            new Date('2023-01-08T10:00:00Z'), // Past event - most recent
            new Date('2023-01-05T10:00:00Z'), // Past event - older
            new Date('2023-01-01T10:00:00Z') // Past event - oldest
        ];
        expect(getDaysSinceLastEventRecord(events, currentDate)).toBe(2);
    });

    it('handles events sorted in different orders', () => {
        const events = [
            new Date('2023-01-15T10:00:00Z'), // Future event
            new Date('2023-01-08T10:00:00Z'), // Past event - most recent
            new Date('2023-01-01T10:00:00Z') // Past event - oldest
        ];
        expect(getDaysSinceLastEventRecord(events, currentDate)).toBe(2);
    });

    it('returns 0 when last event is same date but different time', () => {
        const events = [
            new Date('2023-01-10T08:00:00Z'), // Same day as current date
            new Date('2023-01-05T10:00:00Z') // Older event
        ];
        expect(getDaysSinceLastEventRecord(events, currentDate)).toBe(0);
    });
});
