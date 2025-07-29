const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
export const DAYS_IN_MONTH = 30;
export const DAYS_IN_YEAR = 365;

export type TimeUnit = 'days' | 'months' | 'years';

/**
 * Sorts two date objects in descending order (newest first).
 * This is to be used with array sort methods to order dates from newest to oldest.
 *
 * for example:
 * [new Date('2023-10-01'), new Date('2023-09-30')].sort(sortDateObjectsByNewestFirst)
 * will result in [new Date('2023-10-01'), new Date('2023-09-30')].
 */
export const sortDateObjectsByNewestFirst = (currDate: Date, nextDate: Date) => {
    return nextDate.getTime() - currDate.getTime();
};

/**
 * Converts a number of days to the most appropriate time unit and number.
 * Prioritizes years (if >= 365 days), then months (if >= 30 days),
 * otherwise returns days. Uses floor division for intuitive conversions.
 */
export const convertDaysToUnitAndNumber = (days: number): { number: number; unit: TimeUnit } => {
    if (days >= DAYS_IN_YEAR) {
        return { number: Math.floor(days / DAYS_IN_YEAR), unit: 'years' };
    }

    if (days >= DAYS_IN_MONTH) {
        return { number: Math.floor(days / DAYS_IN_MONTH), unit: 'months' };
    }

    return { number: days, unit: 'days' };
};

/**
 * Gets number of days between two date objects. If time difference has not passed 24 hours, but the two given
 * dates are on different dates, then we'll consider it a 1 day difference.
 */
export const getNumberOfDaysBetweenDates = (start: Date, end: Date): number => {
    const diffInTime = end.getTime() - start.getTime();
    const daysDiff = Math.round(diffInTime / DAY_IN_MILLISECONDS);

    // If dates are on the same day, return 0
    if (
        start.getDate() === end.getDate() &&
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear()
    ) {
        return 0;
    }

    // If dates are on different days but less than 24 hours apart, return 1
    if (daysDiff === 0) {
        return 1;
    }

    return daysDiff;
};

/**
 * Gets the number of days since the last event record that has occurred (not future dates).
 * Returns undefined if no past event records exist.
 *
 * eventRecords is assumed to be sorted in descending order (newest first).
 */
export const getDaysSinceLastEventRecord = (eventRecords: Date[], currentDate: Date): number | undefined => {
    // Find the most recent event record that has happened (not future dates)
    const lastEventRecord = eventRecords.find((eventDate) => {
        return getNumberOfDaysBetweenDates(eventDate, currentDate) >= 0;
    });

    return lastEventRecord ? getNumberOfDaysBetweenDates(lastEventRecord, currentDate) : undefined;
};
