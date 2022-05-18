import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { v4 as uuidv4 } from 'uuid';

import { useComponentDisplayContext } from './ComponentDisplayProvider';
import useLoggableEventsApi from '../utils/useLoggableEventsApi';

interface LoggableEvent {
    /** id of the event */
    id: string;
    /** Name of the event */
    name: string;
    /** Date objects of when this event has been logged */
    eventRecords: Array<Date>;
    /** Whether this event should show */
    active: boolean;
    /** Number of days since the last event record before a warning will show for this event */
    warningThresholdInDays: number;
}

export const EVENT_DEFAULT_VALUES: LoggableEvent = {
    id: '',
    name: '',
    eventRecords: [],
    active: true,
    warningThresholdInDays: 7
};

type LoggableEventsContextType = {
    loggableEvents: Array<LoggableEvent>;
    addLoggableEvent: (newEventName: string, warningThresholdInDays: number) => void;
    removeLoggableEvent: (eventIdToRemove: string) => void;
    updateLoggableEvent: (updatedLoggableEvent: LoggableEvent) => void;
    addRecordToEvent: (eventId: string) => void;
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
     * States and values from providers
     */

    /**
     * List of registered events. A registered event can be logged and maintain records of its own logs.
     */
    const [loggableEvents, setLoggableEvents] = useState<Array<LoggableEvent>>([]);

    const { hideLoadingState, showLoadingState } = useComponentDisplayContext();

    const {
        isLoading,
        fetchedLoggableEvents,
        submitCreateLoggableEvent,
        submitDeleteLoggableEvent,
        submitCreateEventRecord
    } = useLoggableEventsApi(offlineMode);

    /**
     * Effects
     */

    useEffect(() => {
        /**
         * Load fetched data into state
         */
        if (!isLoading && !offlineMode) {
            setLoggableEvents(
                fetchedLoggableEvents.map(
                    ({ id: eventId, name, dateTimeRecords, active, warningThresholdInDays }: any) => {
                        return {
                            id: eventId,
                            name,
                            eventRecords: dateTimeRecords.map((dateTimeISO: string) => new Date(dateTimeISO)),
                            active,
                            warningThresholdInDays
                        };
                    }
                )
            );
            hideLoadingState();
        } else if (offlineMode) {
            hideLoadingState();
        } else if (isLoading) {
            showLoadingState();
        }
    }, [isLoading, offlineMode]);

    /**
     * Register a new loggable event.
     */
    const addLoggableEvent = async (newEventName: string, warningThresholdInDays: number) => {
        const response = await submitCreateLoggableEvent(newEventName);

        setLoggableEvents((prevData) => {
            return [
                {
                    ...EVENT_DEFAULT_VALUES,
                    id: response?.data?.createLoggableEvent?.id || uuidv4(),
                    name: newEventName,
                    warningThresholdInDays
                },
                ...prevData
            ];
        });
    };

    /**
     * Unregister a loggable event.
     */
    const removeLoggableEvent = async (eventIdToRemove: string) => {
        await submitDeleteLoggableEvent(eventIdToRemove);
        setLoggableEvents((prevData) => prevData.filter(({ id }) => id !== eventIdToRemove));
    };

    const updateLoggableEvent = (updatedLoggableEvent: LoggableEvent) => {
        setLoggableEvents((prevData) =>
            prevData.map((eventData) => {
                return eventData.id === updatedLoggableEvent.id ? updatedLoggableEvent : eventData;
            })
        );
    };

    /**
     * Adds a log record with the current time and date to a loggable event. Sorts log records by datetime in descending
     * order (newest first).
     */
    const addRecordToEvent = async (eventId: string) => {
        const currDate = new Date();
        const newEventDateTimeISOString = currDate.toISOString();

        setLoggableEvents((prevData) =>
            prevData.map((eventData: LoggableEvent) => {
                if (eventData.id !== eventId) {
                    return eventData;
                }

                return {
                    ...eventData,
                    eventRecords: [...eventData.eventRecords, currDate].sort((currRecord: Date, nextRecord: Date) => {
                        return nextRecord.getTime() - currRecord.getTime();
                    })
                };
            })
        );

        await submitCreateEventRecord(eventId, newEventDateTimeISOString);
    };

    const contextValue: LoggableEventsContextType = {
        loggableEvents,
        addLoggableEvent,
        removeLoggableEvent,
        updateLoggableEvent,
        addRecordToEvent
    };

    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

export default LoggableEventsProvider;
