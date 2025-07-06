import { createMockEventLabel } from './eventLabels';
import { createMockLoggableEvent } from './loggableEvent';
import { createMockUser } from './user';

import { AuthContextType } from '../providers/AuthProvider';
import { LoggableEventsContextType } from '../providers/LoggableEventsProvider';
import { ViewOptionsContextType } from '../providers/ViewOptionsProvider';

export const createMockAuthContextValue = (overrides: Partial<AuthContextType> = {}): AuthContextType => {
    return {
        user: createMockUser(),
        token: 'mock-token',
        isAuthenticated: true,
        isOfflineMode: false,
        login: (_token, _user) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        logout: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        setOfflineMode: (_isOffline) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        ...overrides
    };
};

export const createMockLoggableEventsContextValue = (
    overrides: Partial<LoggableEventsContextType> = {}
): LoggableEventsContextType => {
    return {
        loggableEvents: [createMockLoggableEvent()],
        eventLabels: [
            createMockEventLabel({ id: 'label-1', name: 'Work' }),
            createMockEventLabel({ id: 'label-2', name: 'Personal' })
        ],
        dataIsLoaded: true,
        createLoggableEvent: (newEventName, warningThresholdInDays, labelIds) =>
            createMockLoggableEvent({ name: newEventName, warningThresholdInDays, labelIds }),
        loadLoggableEvents: (_loggableEvents) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        loadEventLabels: (_eventLabels) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        addTimestampToEvent: (_eventId, _dateToAdd) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        updateLoggableEventDetails: (_updatedLoggableEvent) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        deleteLoggableEvent: (_eventIdToRemove) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        createEventLabel: (name) => createMockEventLabel({ name }),
        updateEventLabel: (_updatedEventLabel) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        deleteEventLabel: (_eventLabelId) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        ...overrides
    };
};

export const createMockViewOptionsContextValue = (
    overrides: Partial<ViewOptionsContextType> = {}
): ViewOptionsContextType => {
    return {
        theme: 'light',
        enableLightTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        enableDarkTheme: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        activeEventLabelId: createMockEventLabel().id,
        setActiveEventLabelId: (_id) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        ...overrides
    };
};
