import { createMockEventLabel } from './eventLabels';
import { createMockUser } from './user';

import { AuthContextType } from '../providers/AuthProvider';
import { ViewOptionsContextType } from '../providers/ViewOptionsProvider';

export const createMockAuthContextValue = (overrides: Partial<AuthContextType> = {}): AuthContextType => {
    return {
        user: createMockUser(),
        isOfflineMode: false,
        isInitializing: false,
        setAuthData: (_accessToken, _user) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars
        clearAuthData: () => {},
        setOfflineMode: (_isOffline) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...overrides
    };
};

export const createMockViewOptionsContextValue = (
    overrides: Partial<ViewOptionsContextType> = {}
): ViewOptionsContextType => {
    return {
        theme: 'light',
        enableLightTheme: () => {},
        enableDarkTheme: () => {},
        activeEventLabelId: createMockEventLabel().id,
        setActiveEventLabelId: (_id) => {}, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...overrides
    };
};
