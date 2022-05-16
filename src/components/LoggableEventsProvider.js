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
    const [loggableEvents, setLoggableEvents] = useState([]);
    const addLoggableEvent = (newEventId) =>
        setLoggableEvents((currLoggableEvents) => {
            return [
                ...currLoggableEvents,
                {
                    id: newEventId,
                    loggedEvents: [],
                    active: true
                }
            ];
        });
    const removeLoggableEvent = (eventIdToRemove) =>
        setLoggableEvents((currEvents) => currEvents.filter((loggableEvent) => loggableEvent.id !== eventIdToRemove));
    const updateLoggableEventIsActive = (eventId, isActive) =>
        loggableEvents.map((eventData) => {
            return eventData.id === eventId
                ? {
                      ...eventData,
                      active: isActive
                  }
                : eventData;
        });

    const contextValue = {
        loggableEvents,
        addLoggableEvent,
        removeLoggableEvent,
        updateLoggableEventIsActive
    };
    return <LoggableEventsContext.Provider value={contextValue}>{children}</LoggableEventsContext.Provider>;
};

LoggableEventsProvider.propTypes = {
    children: PropTypes.node
};

export default LoggableEventsProvider;
