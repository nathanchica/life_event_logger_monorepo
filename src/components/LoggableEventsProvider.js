import { createContext, useContext, useState } from 'react';
import invariant from 'invariant';
import PropTypes from 'prop-types';

export const LoggableEventsContext = createContext(null);

export const useLoggableEventsContext = () => {
    const context = useContext(LoggableEventsContext);
    invariant(context, 'This component must be wrapped by LoggableEventsProvider');
    return context;
};

const LoggableEventsProvider = ({ children }) => {
    /**
     * List of registered events that can be logged.
     */
    const [loggableEvents, setLoggableEvents] = useState([]);

    /**
     * Register a new event.
     */
    const addLoggableEvent = (newEventId) =>
        setLoggableEvents((currEvents) => {
            return [
                ...currEvents,
                {
                    id: newEventId,
                    logRecords: [],
                    active: true
                }
            ];
        });

    /**
     * Unregister an event.
     */
    const removeLoggableEvent = (eventIdToRemove) =>
        setLoggableEvents((currEvents) => currEvents.filter((loggableEvent) => loggableEvent.id !== eventIdToRemove));

    /**
     * Update the `active` field of a registered event. `active` will determine if the event will be displayed in the
     * view with the events and their log records.
     */
    const updateLoggableEventIsActive = (eventId, isActive) => {
        setLoggableEvents((currEvents) =>
            currEvents.map((eventData) => {
                return eventData.id === eventId
                    ? {
                          ...eventData,
                          active: isActive
                      }
                    : eventData;
            })
        );
    };

    /**
     * Adds a log record for the current time and date to a registered event
     */
    const addRecordToEvent = (eventId) => {
        setLoggableEvents((currEvents) =>
            currEvents.map((eventData) => {
                if (eventData.id !== eventId) {
                    return eventData;
                }

                const currDate = new Date();
                const newLogEvent = {
                    displayString: currDate.toLocaleString('en-US'),
                    id: currDate.toISOString()
                };
                return {
                    ...eventData,
                    logRecords: [...eventData.logRecords, newLogEvent]
                };
            })
        );
    };

    const contextValue = {
        loggableEvents,
        addLoggableEvent,
        removeLoggableEvent,
        updateLoggableEventIsActive,
        addRecordToEvent
    };

    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

LoggableEventsProvider.propTypes = {
    children: PropTypes.node
};

export default LoggableEventsProvider;
