import { vi } from 'vitest';

import { convertDaysToUnitAndNumber, processEventTimestamps } from '../time';

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

describe('processEventTimestamps', () => {
    const mockCurrentDate = new Date('2024-01-15T00:00:00.000Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockCurrentDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([
        {
            scenario: 'empty array',
            timestamps: [],
            expectedSortedTimestamps: [],
            expectedDaysSinceLastEvent: undefined
        },
        {
            scenario: 'single past event',
            timestamps: [new Date('2024-01-10T00:00:00.000Z')],
            expectedSortedTimestamps: [new Date('2024-01-10T00:00:00.000Z')],
            expectedDaysSinceLastEvent: 5
        },
        {
            scenario: 'multiple past events unsorted',
            timestamps: [
                new Date('2024-01-10T00:00:00.000Z'),
                new Date('2024-01-15T00:00:00.000Z'),
                new Date('2024-01-05T00:00:00.000Z'),
                new Date('2024-01-12T00:00:00.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-15T00:00:00.000Z'),
                new Date('2024-01-12T00:00:00.000Z'),
                new Date('2024-01-10T00:00:00.000Z'),
                new Date('2024-01-05T00:00:00.000Z')
            ],
            expectedDaysSinceLastEvent: 0
        },
        {
            scenario: 'same day event',
            timestamps: [new Date('2024-01-15T00:00:00.000Z'), new Date('2024-01-10T00:00:00.000Z')],
            expectedSortedTimestamps: [new Date('2024-01-15T00:00:00.000Z'), new Date('2024-01-10T00:00:00.000Z')],
            expectedDaysSinceLastEvent: 0
        },
        {
            scenario: 'mixed future and past events',
            timestamps: [
                new Date('2024-01-20T00:00:00.000Z'),
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-10T00:00:00.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-20T00:00:00.000Z'),
                new Date('2024-01-10T00:00:00.000Z')
            ],
            expectedDaysSinceLastEvent: 5
        },
        {
            scenario: 'all future events',
            timestamps: [
                new Date('2024-01-20T00:00:00.000Z'),
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-30T00:00:00.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-30T00:00:00.000Z'),
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-20T00:00:00.000Z')
            ],
            expectedDaysSinceLastEvent: undefined
        },
        {
            scenario: 'complex mixed past and future events',
            timestamps: [
                new Date('2024-01-10T00:00:00.000Z'),
                new Date('2024-01-20T00:00:00.000Z'),
                new Date('2024-01-05T00:00:00.000Z'),
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-14T00:00:00.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-25T00:00:00.000Z'),
                new Date('2024-01-20T00:00:00.000Z'),
                new Date('2024-01-14T00:00:00.000Z'),
                new Date('2024-01-10T00:00:00.000Z'),
                new Date('2024-01-05T00:00:00.000Z')
            ],
            expectedDaysSinceLastEvent: 1
        },
        {
            scenario: 'timestamps with time components',
            timestamps: [
                new Date('2024-01-10T08:30:00.000Z'),
                new Date('2024-01-10T23:59:59.000Z'),
                new Date('2024-01-11T00:00:01.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-11T00:00:01.000Z'),
                new Date('2024-01-10T23:59:59.000Z'),
                new Date('2024-01-10T08:30:00.000Z')
            ],
            expectedDaysSinceLastEvent: 4
        },
        {
            scenario: 'events from different years',
            timestamps: [
                new Date('2023-12-31T00:00:00.000Z'),
                new Date('2024-01-01T00:00:00.000Z'),
                new Date('2023-01-15T00:00:00.000Z')
            ],
            expectedSortedTimestamps: [
                new Date('2024-01-01T00:00:00.000Z'),
                new Date('2023-12-31T00:00:00.000Z'),
                new Date('2023-01-15T00:00:00.000Z')
            ],
            expectedDaysSinceLastEvent: 14
        }
    ])('$scenario', ({ timestamps, expectedSortedTimestamps, expectedDaysSinceLastEvent }) => {
        const result = processEventTimestamps(timestamps);

        expect(result.sortedTimestamps).toEqual(expectedSortedTimestamps);
        expect(result.daysSinceLastEvent).toBe(expectedDaysSinceLastEvent);
    });

    it('preserves original array and does not mutate it', () => {
        const originalTimestamps = [
            new Date('2024-01-10T00:00:00.000Z'),
            new Date('2024-01-15T00:00:00.000Z'),
            new Date('2024-01-05T00:00:00.000Z')
        ];
        const timestampsCopy = [...originalTimestamps];

        processEventTimestamps(originalTimestamps);

        expect(originalTimestamps).toEqual(timestampsCopy);
    });
});
