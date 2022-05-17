import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import invariant from 'tiny-invariant';

import { useComponentDisplayContext } from './ComponentDisplayProvider';
import useLoggableEventsApi from '../utils/useLoggableEventsApi';

interface EventRecord {
    /** Human-readable string that will be displayed */
    displayText: string;
    /** String that will be stored in the backend */
    isoString: string;
    /** Date object for comparison purposes */
    dateObject: Date;
}

interface LoggableEvent {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Log records of the event */
    logRecords: Array<EventRecord>;
    /** Whether this event should show */
    active: boolean;
}

type LoggableEventsContextType = {
    loggableEvents: Array<LoggableEvent>;
    addLoggableEvent: (eventName: string) => void;
    removeLoggableEvent: (eventNameToRemove: string) => void;
    updateLoggableEventIsActive: (eventName: string, isActive: boolean) => void;
    updateLoggableEventName: (currEventName: string, newName: string) => void;
    addRecordToEvent: (eventName: string) => void;
};

export const LoggableEventsContext = createContext<LoggableEventsContextType | null>(null);

export const useLoggableEventsContext = () => {
    const context = useContext(LoggableEventsContext);
    invariant(context, 'This component must be wrapped by LoggableEventsProvider');
    return context;
};

const createEventRecordFromDateObject = (dateObject: Date) => {
    return {
        displayText: dateObject.toLocaleString('en-US'),
        isoString: dateObject.toISOString(),
        dateObject
    };
};

type Props = {
    children: ReactNode;
};

const LoggableEventsProvider = ({ children }: Props) => {
    /**
     * List of registered events. A registered event can be logged and maintain records of its own logs.
     */
    const [loggableEvents, setLoggableEvents] = useState<Array<LoggableEvent>>([]);

    /**
     * Data fetch
     */
    const { hideLoadingSpinner } = useComponentDisplayContext();
    const {
        isLoading,
        fetchError,
        fetchedLoggableEvents,
        refetchLoggableEvents,
        createEventRecordIsSubmitting,
        createEventRecordError,
        submitCreateEventRecord
    } = useLoggableEventsApi();

    useEffect(() => {
        if (!isLoading) {
            setLoggableEvents(
                fetchedLoggableEvents.map(({ id: eventId, name, dateTimeRecords, active }: any) => {
                    return {
                        id: eventId,
                        name,
                        logRecords: dateTimeRecords.map((dateTimeISO: string) => {
                            return createEventRecordFromDateObject(new Date(dateTimeISO));
                        }),
                        active
                    };
                })
            );
            hideLoadingSpinner();
        }
    }, [isLoading]);

    useEffect(() => {
        if (fetchError) {
            console.error(fetchError);
        }
    }, [fetchError]);

    /**
     * Register a new loggable event.
     */
    const addLoggableEvent = (newEventName: string) => {
        setLoggableEvents((prevData) => {
            return [
                ...prevData,
                {
                    id: '',
                    name: newEventName,
                    logRecords: [],
                    active: true
                }
            ];
        });
    };

    /**
     * Unregister a loggable event.
     */
    const removeLoggableEvent = (eventNameToRemove: string) => {
        setLoggableEvents((prevData) => prevData.filter(({ name }) => name !== eventNameToRemove));
    };

    /**
     * Update the `active` field of a loggable event. `active` will determine if the event will be displayed in the
     * view that displays loggable events and their records.
     */
    const updateLoggableEventIsActive = (eventName: string, isActive: boolean) => {
        setLoggableEvents((prevData) =>
            prevData.map((eventData) => {
                return eventData.name === eventName
                    ? {
                          ...eventData,
                          active: isActive
                      }
                    : eventData;
            })
        );
    };

    /**
     * Update the `name` field of a loggable event.
     */
    const updateLoggableEventName = (currEventName: string, newName: string) => {
        setLoggableEvents((prevData) =>
            prevData.map((eventData) => {
                return eventData.name === currEventName
                    ? {
                          ...eventData,
                          name: newName
                      }
                    : eventData;
            })
        );
    };

    /**
     * Adds a log record with the current time and date to a loggable event. Sorts log records by datetime in descending
     * order (newest first).
     */
    const addRecordToEvent = async (eventName: string) => {
        let eventIdToUpdate;
        let newEventDateTimeISOString;
        setLoggableEvents((prevData) =>
            prevData.map((eventData: LoggableEvent) => {
                if (eventData.name !== eventName) {
                    return eventData;
                }

                const newLogEvent = createEventRecordFromDateObject(new Date());

                eventIdToUpdate = eventData.id;
                newEventDateTimeISOString = newLogEvent.isoString;

                return {
                    ...eventData,
                    logRecords: [...eventData.logRecords, newLogEvent].sort((currRecord, nextRecord) => {
                        return nextRecord.dateObject.getTime() - currRecord.dateObject.getTime();
                    })
                };
            })
        );

        if (eventIdToUpdate) {
            await submitCreateEventRecord({
                variables: {
                    loggableEventId: eventIdToUpdate,
                    input: {
                        dateTimeISO: newEventDateTimeISOString
                    }
                }
            });
            refetchLoggableEvents();
        }
    };

    const contextValue: LoggableEventsContextType = {
        loggableEvents,
        addLoggableEvent,
        removeLoggableEvent,
        updateLoggableEventIsActive,
        updateLoggableEventName,
        addRecordToEvent
    };

    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

export default LoggableEventsProvider;
