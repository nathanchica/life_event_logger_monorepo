export const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

/**
 * Gets number of days between two date objects.
 */
export function getNumberOfDaysBetweenDates(start: Date, end: Date) {
    const diffInTime = end.getTime() - start.getTime();
    return Math.round(diffInTime / DAY_IN_MILLISECONDS);
}
