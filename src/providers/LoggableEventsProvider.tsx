import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { v4 as uuidv4 } from 'uuid';

import useLoggableEventsApi from '../utils/useLoggableEventsApi';
import { sortDateObjectsByNewestFirst } from '../utils/time';

export interface EventLabel {
    /** id of the event label */
    id: string;
    /** Displayable name of the event label */
    name: string;
}

interface LoggableEvent {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date objects of when this event has been logged */
    timestamps: Array<Date>;
    /** Whether this event should show */
    active: boolean;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
    /** List of event label ids associated with this event */
    labelIds: Array<string>;
}

export const EVENT_DEFAULT_VALUES: LoggableEvent = {
    id: '',
    name: '',
    timestamps: [],
    active: true,
    /**
     * Default behavior is that warnings are disabled,
     * but if the warning behavior is enabled, then this is the default value to show.
     */
    warningThresholdInDays: 7,
    labelIds: []
};

type LoggableEventsContextType = {
    /**
     * List of loggable events. A loggable event can be logged and maintain timestamp records of its own logs.
     */
    loggableEvents: Array<LoggableEvent>;
    /**
     * List of event labels. Loggable events can be associated with and organized by event labels.
     */
    eventLabels: Array<EventLabel>;
    /**
     * Whether or not we have finished loading fetched data into states
     */
    dataIsLoaded: boolean;
    /**
     * Create a new loggable event. Inserts the new event into the beginning of the list of loggable events.
     */
    createLoggableEvent: (newEventName: string, warningThresholdInDays: number, labelIds: Array<string>) => void;
    /**
     * Adds a timestamp in ISO string format to a loggable event. Sorts log records by datetime in descending
     * order (newest first).
     */
    addTimestampToEvent: (eventId: string, dateToAdd: Date) => void;
    /**
     * Updates details of a loggable event.
     */
    updateLoggableEventDetails: (updatedLoggableEvent: LoggableEvent) => void;
    /**
     * Deletes a loggable event.
     */
    removeLoggableEvent: (eventIdToRemove: string) => void;
    /**
     * Creates an event label.
     */
    createEventLabel: (name: string) => void;
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
    offlineMode: boolean;
    children: ReactNode;
};

const LoggableEventsProvider = ({ offlineMode, children }: Props) => {
    /**
     * States
     */
    const [loggableEvents, setLoggableEvents] = useState<Array<LoggableEvent>>([]);
    const [eventLabels, setEventLabels] = useState<Array<EventLabel>>([]);
    const [dataIsLoaded, setDataIsLoaded] = useState<boolean>(false);

    /**
     * API methods
     */
    const {
        isFetchingData,
        fetchedLoggableEvents,
        fetchedEventLabels,
        submitCreateLoggableEvent,
        submitCreateEventRecord,
        submitUpdateLoggableEventDetails,
        submitDeleteLoggableEvent,
        submitCreateEventLabel,
        submitUpdateEventLabel,
        submitDeleteEventLabel
    } = useLoggableEventsApi(offlineMode);

    /**
     * Effects
     */
    useEffect(() => {
        /**
         * Load fetched data into states
         */
        if (!isFetchingData && !offlineMode) {
            setLoggableEvents(
                fetchedLoggableEvents.map(
                    ({ id: eventId, name, timestamps, active, warningThresholdInDays, labelIds }: any) => {
                        return {
                            id: eventId,
                            name,
                            timestamps: timestamps.map((dateTimeISO: string) => new Date(dateTimeISO)),
                            active,
                            warningThresholdInDays,
                            labelIds
                        };
                    }
                )
            );
            setEventLabels(
                fetchedEventLabels.map(({ id: eventLabelId, alias, color }: any) => {
                    return {
                        id: eventLabelId,
                        alias,
                        color
                    };
                })
            );
            setDataIsLoaded(true);
        } else if (offlineMode) {
            setDataIsLoaded(true);
        } else if (isFetchingData) {
            setDataIsLoaded(false);
        }
    }, [isFetchingData, offlineMode]);

    /**
     * Exported methods that update states and values in backend. If in offline mode, only states will be updated (the
     * submit calls will resolve to null data).
     */

    const createLoggableEvent = async (
        newEventName: string,
        warningThresholdInDays: number,
        labelIds: Array<string>
    ) => {
        const response = await submitCreateLoggableEvent(newEventName, warningThresholdInDays, labelIds);

        setLoggableEvents((prevData) => {
            return [
                {
                    ...EVENT_DEFAULT_VALUES,
                    id: response?.data?.createLoggableEvent?.id || uuidv4(),
                    name: newEventName,
                    warningThresholdInDays,
                    labelIds
                },
                ...prevData
            ];
        });
    };

    const addTimestampToEvent = async (eventId: string, dateToAdd: Date) => {
        const newEventDateTimeISOString = dateToAdd.toISOString();

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

        await submitCreateEventRecord(eventId, newEventDateTimeISOString);
    };

    const updateLoggableEventDetails = async (updatedLoggableEvent: LoggableEvent) => {
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

        await submitUpdateLoggableEventDetails({
            eventId: updatedLoggableEvent.id,
            ...updatedLoggableEvent
        });
    };

    const removeLoggableEvent = async (eventIdToRemove: string) => {
        await submitDeleteLoggableEvent(eventIdToRemove);
        setLoggableEvents((prevData) => prevData.filter(({ id }) => id !== eventIdToRemove));
    };

    const createEventLabel = async (name: string) => {
        const response = await submitCreateEventLabel(name);

        setEventLabels((prevData) => {
            return [
                {
                    id: response?.data?.createEventLabel?.id || uuidv4(),
                    name
                },
                ...prevData
            ];
        });
    };

    const updateEventLabel = async (updatedEventLabel: EventLabel) => {
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

        await submitUpdateEventLabel(updatedEventLabel.id, updatedEventLabel.name);
    };

    const deleteEventLabel = async (eventLabelIdToRemove: string) => {
        await submitDeleteEventLabel(eventLabelIdToRemove);
        setEventLabels((prevData) => prevData.filter(({ id }) => id !== eventLabelIdToRemove));
    };

    const contextValue: LoggableEventsContextType = {
        loggableEvents,
        eventLabels,
        dataIsLoaded,
        createLoggableEvent,
        addTimestampToEvent,
        updateLoggableEventDetails,
        removeLoggableEvent,
        createEventLabel,
        updateEventLabel,
        deleteEventLabel
    };

    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

export default LoggableEventsProvider;
