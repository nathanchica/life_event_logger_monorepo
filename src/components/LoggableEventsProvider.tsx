import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

interface EventRecord {
    /** Human-readable string that will be displayed */
    displayText: string;
    /** String that will be stored in the backend */
    isoString: string;
}

interface LoggableEvent {
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

type Props = {
    children: ReactNode;
};

const LoggableEventsProvider = ({ children }: Props) => {
    /**
     * List of registered events. A registered event can be logged and maintain records of its own logs.
     */
    const [loggableEvents, setLoggableEvents] = useState<Array<LoggableEvent>>([]);

    /**
     * Register a new loggable event.
     */
    function addLoggableEvent(newEventName: string) {
        setLoggableEvents((prevData) => {
            return [
                ...prevData,
                {
                    name: newEventName,
                    logRecords: [],
                    active: true
                }
            ];
        });
    }

    /**
     * Unregister a loggable event.
     */
    function removeLoggableEvent(eventNameToRemove: string) {
        setLoggableEvents((prevData) => prevData.filter(({ name }) => name !== eventNameToRemove));
    }

    /**
     * Update the `active` field of a loggable event. `active` will determine if the event will be displayed in the
     * view that displays loggable events and their records.
     */
    function updateLoggableEventIsActive(eventName: string, isActive: boolean) {
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
    }

    /**
     * Update the `name` field of a loggable event.
     */
    function updateLoggableEventName(currEventName: string, newName: string) {
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
    }

    /**
     * Adds a log record with the current time and date to a loggable event.
     */
    function addRecordToEvent(eventName: string) {
        setLoggableEvents((prevData) =>
            prevData.map((eventData: LoggableEvent) => {
                if (eventData.name !== eventName) {
                    return eventData;
                }

                const currDate = new Date();
                const newLogEvent = {
                    displayText: currDate.toLocaleString('en-US'),
                    isoString: currDate.toISOString()
                };
                return {
                    ...eventData,
                    logRecords: [...eventData.logRecords, newLogEvent]
                };
            })
        );
    }

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
