export interface User {
    /** Unique id of the user */
    id: string;
    /** Email of the user */
    email: string;
    /** Displayable name of the user */
    name: string;
}

export interface EventLabel {
    /** id of the event label */
    id: string;
    /** Displayable name of the event label */
    name: string;
    /** Date object of when the event label was created */
    createdAt: Date;
    /** Whether or not the event label is synced with the backend */
    isSynced: boolean;
}

export interface LoggableEvent {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date objects of when this event has been logged */
    timestamps: Array<Date>;
    /** Date object of when the event was created */
    createdAt: Date;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
    /** List of event label ids associated with this event */
    labelIds: Array<string>;
    /** Whether or not the event is synced with the backend */
    isSynced: boolean;
}

/**
 * GQL types
 */

export type UserGQL = {
    /** Unique id of the user */
    id: string;
    /** Email of the user */
    email: string;
    /** Displayable name of the user */
    name: string;
};

export type EventLabelGQL = {
    /** id of the event label */
    id: string;
    /** Displayable name of the event label */
    name: string;
    /** Date string (ISO format) of when the event label was created */
    createdAt: string;
};

export type LoggableEventGQL = {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date strings (ISO format) of when this event has been logged */
    timestamps: Array<string>;
    /** Date string (ISO format) of when the event was created */
    createdAt: string;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
    /** List of event labels associated with this event */
    labels: Array<EventLabelGQL>;
};
