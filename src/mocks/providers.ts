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
        login: (_token, _user) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        logout: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        setOfflineMode: (_isOffline) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
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
