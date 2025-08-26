import { differenceInCalendarDays } from 'date-fns';

export const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
export const DAYS_IN_MONTH = 30;
export const DAYS_IN_YEAR = 365;

export type TimeUnit = 'days' | 'months' | 'years';

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

type ProcessedTimestampsPayload = {
    /**
     * Timestamps sorted in descending order (newest first)
     */
    sortedTimestamps: Date[];
    /**
     * Number of days since the last event record that has occured (not future dates).
     * undefined if no past event records exist.
     */
    daysSinceLastEvent: number | undefined;
};

export const processEventTimestamps = (timestamps: Date[]): ProcessedTimestampsPayload => {
    const currDate = new Date();
    const sortedTimestamps = [...timestamps].sort((curr, next) => next.getTime() - curr.getTime());

    // Find the most recent event record that has happened (not future dates)
    const lastEventRecord = sortedTimestamps.find((eventDate) => {
        return differenceInCalendarDays(currDate, eventDate) >= 0;
    });
    const daysSinceLastEvent = lastEventRecord ? differenceInCalendarDays(currDate, lastEventRecord) : undefined;

    return {
        sortedTimestamps,
        daysSinceLastEvent
    };
};
