export const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
export const DAYS_IN_MONTH = 30;
export const DAYS_IN_YEAR = 365;
export const MONTHS_IN_YEAR = 12;

export type TimeUnit = 'days' | 'months' | 'years';

/**
 * Gets number of days between two date objects. If time difference has not passed 24 hours, but the two given
 * dates are on different dates, then we'll consider it a 1 day difference.
 */
export const getNumberOfDaysBetweenDates = (start: Date, end: Date): number => {
    const diffInTime = end.getTime() - start.getTime();
    const daysDiff = Math.round(diffInTime / DAY_IN_MILLISECONDS);

    if (daysDiff === 0) {
        /**
         * If given dates are different dates, consider it a 1 day difference
         * even if the difference is less than 24 hrs.
         */
        return start.getDate() !== end.getDate() ? 1 : 0;
    }

    return daysDiff;
};

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
 * Gets the number of days since the last event record that has occurred (not future dates).
 * Returns undefined if no past event records exist.
 */
export const getDaysSinceLastEventRecord = (eventRecords: Date[], currentDate: Date): number | undefined => {
    // Find the most recent event record that has happened (not future dates)
    const lastEventRecord = eventRecords.find((eventDate) => {
        return getNumberOfDaysBetweenDates(eventDate, currentDate) >= 0;
    });

    return lastEventRecord ? getNumberOfDaysBetweenDates(lastEventRecord, currentDate) : undefined;
};
