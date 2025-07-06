import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import invariant from 'tiny-invariant';
import { v4 as uuidv4 } from 'uuid';

import { sortDateObjectsByNewestFirst } from '../utils/time';
import { EventLabel, LoggableEvent } from '../utils/types';

export const EVENT_DEFAULT_VALUES: LoggableEvent = {
    id: '',
    name: '',
    timestamps: [],
    createdAt: new Date(),
    /**
     * Default behavior is that warnings are disabled,
     * but if the warning behavior is enabled, then this is the default value to show.
     */
    warningThresholdInDays: 7,
    labelIds: [],
    isSynced: false
};

export type LoggableEventsContextType = {
    /**
     * List of loggable events. A loggable event is a repeatable action that can be logged.
     */
    loggableEvents: Array<LoggableEvent>;
    /**
     * List of event labels. Loggable events can be organized by event labels.
     */
    eventLabels: Array<EventLabel>;
    /**
     * Whether or not we have finished loading data into states
     */
    dataIsLoaded: boolean;
    /**
     * Create a new loggable event and returns it.
     * Inserts the new event into the beginning of the list of loggable events.
     * Returns the newly created loggable event.
     */
    createLoggableEvent: (
        newEventName: string,
        warningThresholdInDays: number,
        labelIds: Array<string>
    ) => LoggableEvent;
    /**
     * Loads loggable events into the context.
     * This is used to load initial data or to update the context with new data.
     */
    loadLoggableEvents: (loggableEvents: Array<LoggableEvent>) => void;
    /**
     * Loads event labels into the context.
     * This is used to load initial data or to update the context with new data.
     */
    loadEventLabels: (eventLabels: Array<EventLabel>) => void;
    /**
     * Adds a timestamp record to a loggable event. Sorts log records by datetime in descending order (newest first).
     */
    addTimestampToEvent: (eventId: string, dateToAdd: Date) => void;
    /**
     * Updates details of a loggable event.
     */
    updateLoggableEventDetails: (updatedLoggableEvent: LoggableEvent) => void;
    /**
     * Deletes a loggable event.
     */
    deleteLoggableEvent: (eventIdToRemove: string) => void;
    /**
     * Creates an event label.
     * Inserts the new event label into the beginning of the list of event labels.
     * Returns the newly created event label.
     */
    createEventLabel: (name: string) => EventLabel;
    /**
     * Update details of an event label.
     */
    updateEventLabel: (updatedEventLabel: EventLabel) => void;
    /**
     * Delete an event label.
     */
    deleteEventLabel: (eventLabelId: string) => void;
};

export const LoggableEventsContext = createContext<LoggableEventsContextType | null>(null);

export const useLoggableEventsContext = () => {
    const context = useContext(LoggableEventsContext);
    invariant(context, 'This component must be wrapped by LoggableEventsProvider');
    return context;
};

type Props = {
    children: ReactNode;
};

/**
 * LoggableEventsProvider is a context provider that manages loggable events and event labels.
 */
const LoggableEventsProvider = ({ children }: Props) => {
    /**
     * States
     */
    const [loggableEvents, setLoggableEvents] = useState<Array<LoggableEvent>>([]);
    const [eventLabels, setEventLabels] = useState<Array<EventLabel>>([]);
    const [loggableEventsIsLoaded, setLoggableEventsIsLoaded] = useState<boolean>(false);
    const [eventLabelsIsLoaded, setEventLabelsIsLoaded] = useState<boolean>(false);
    const [dataIsLoaded, setDataIsLoaded] = useState<boolean>(false);

    /**
     * Methods
     */

    const createLoggableEvent = (newEventName: string, warningThresholdInDays: number, labelIds: Array<string>) => {
        const newLoggableEvent: LoggableEvent = {
            ...EVENT_DEFAULT_VALUES,
            id: `temp-${uuidv4()}`, // Temporary ID for optimistic UI update
            name: newEventName,
            warningThresholdInDays,
            createdAt: new Date(),
            labelIds,
            isSynced: false // Initially not synced until confirmed by backend
        };

        setLoggableEvents((prevData) => {
            return [newLoggableEvent, ...prevData];
        });

        return newLoggableEvent;
    };

    const loadLoggableEvents = (loggableEvents: Array<LoggableEvent>) => {
        setLoggableEvents(loggableEvents);
        setLoggableEventsIsLoaded(true);
    };

    const loadEventLabels = (eventLabels: Array<EventLabel>) => {
        setEventLabels(eventLabels);
        setEventLabelsIsLoaded(true);
    };

    const addTimestampToEvent = (eventId: string, dateToAdd: Date) => {
        setLoggableEvents((prevData) =>
            prevData.map((eventData: LoggableEvent) => {
                if (eventData.id !== eventId) {
                    return eventData;
                }

                return {
                    ...eventData,
                    timestamps: [...eventData.timestamps, dateToAdd].sort(sortDateObjectsByNewestFirst)
                };
            })
        );
    };

    const updateLoggableEventDetails = (updatedLoggableEvent: LoggableEvent) => {
        setLoggableEvents((prevData) =>
            prevData.map((eventData) => {
                if (eventData.id !== updatedLoggableEvent.id) {
                    return eventData;
                }

                return {
                    ...eventData,
                    ...updatedLoggableEvent
                };
            })
        );
    };

    const deleteLoggableEvent = (eventIdToRemove: string) => {
        setLoggableEvents((prevData) => prevData.filter(({ id }) => id !== eventIdToRemove));
    };

    const createEventLabel = (name: string): EventLabel => {
        const newEventLabel: EventLabel = {
            id: `temp-${uuidv4()}`, // Temporary ID for optimistic UI update
            name,
            createdAt: new Date(),
            isSynced: false // Initially not synced until confirmed by backend
        };

        setEventLabels((prevData) => {
            return [newEventLabel, ...prevData];
        });

        return newEventLabel;
    };

    const updateEventLabel = (updatedEventLabel: EventLabel) => {
        setEventLabels((prevData) =>
            prevData.map((eventLabelData) => {
                if (eventLabelData.id !== updatedEventLabel.id) {
                    return eventLabelData;
                }

                return {
                    ...eventLabelData,
                    ...updatedEventLabel
                };
            })
        );
    };

    const deleteEventLabel = (eventLabelIdToRemove: string) => {
        setEventLabels((prevData) => prevData.filter(({ id }) => id !== eventLabelIdToRemove));
    };

    useEffect(() => {
        if (loggableEventsIsLoaded && eventLabelsIsLoaded) {
            setDataIsLoaded(true);
        }
    }, [loggableEventsIsLoaded, eventLabelsIsLoaded]);

    const contextValue: LoggableEventsContextType = {
        loggableEvents,
        eventLabels,
        dataIsLoaded,
        createLoggableEvent,
        loadLoggableEvents,
        loadEventLabels,
        addTimestampToEvent,
        updateLoggableEventDetails,
        deleteLoggableEvent,
        createEventLabel,
        updateEventLabel,
        deleteEventLabel
    };

    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

export default LoggableEventsProvider;
