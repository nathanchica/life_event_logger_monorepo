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
}

export interface LoggableEvent {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date objects of when this event has been logged */
    timestamps: Array<Date>;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
    /** List of event label ids associated with this event */
    labelIds: Array<string>;
}

/**
 * GQL Fragment types
 */

export type UserFragment = {
    /** GraphQL typename */
    __typename: string;
    /** Unique id of the user */
    id: string;
    /** Email of the user */
    email: string;
    /** Displayable name of the user */
    name: string;
};

export type EventLabelFragment = {
    /** GraphQL typename */
    __typename: string;
    /** id of the event label */
    id: string;
    /** Displayable name of the event label */
    name: string;
};

export type LoggableEventFragment = {
    /** GraphQL typename */
    __typename: string;
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date strings (ISO format) of when this event has been logged */
    timestamps: Array<string>;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
    /** List of event labels associated with this event */
    labels: Array<EventLabelFragment>;
};

export type GenericApiError = {
    /** GraphQL typename */
    __typename: string;
    /** Error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Optional field that caused the error */
    field?: string;
};
