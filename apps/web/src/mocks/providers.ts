import { createMockEventLabel } from './eventLabels';
import { createMockUser } from './user';

import { AuthContextType } from '../providers/AuthProvider';
import { ViewOptionsContextType } from '../providers/ViewOptionsProvider';

export const createMockAuthContextValue = (overrides: Partial<AuthContextType> = {}): AuthContextType => {
    return {
        user: createMockUser(),
        token: 'mock-token',
        isAuthenticated: true,
        isOfflineMode: false,
        isInitializing: true,
        login: (_googleToken) => Promise.resolve(true), // eslint-disable-line @typescript-eslint/no-unused-vars
        logout: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        setOfflineMode: (_isOffline) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        refreshAuth: () => Promise.resolve(true),
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
