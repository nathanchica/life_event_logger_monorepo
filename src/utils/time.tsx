export const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
export const DAYS_IN_MONTH = 30;
export const DAYS_IN_YEAR = 365;

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
