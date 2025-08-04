import { render, screen } from '@testing-library/react';

import { createMockAuthContextValue, createMockViewOptionsContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext, offlineUser } from '../../providers/AuthProvider';
import { ViewOptionsContext } from '../../providers/ViewOptionsProvider';
import EventLoggerPage from '../EventLoggerPage';

// Mock Google OAuth to avoid provider errors
jest.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }) => children,
    GoogleLogin: () => <div>Google Login</div>,
    useGoogleOneTapLogin: () => null
}));

// Mock LoggableEventsGQL component
jest.mock('../LoggableEventsGQL', () => ({
    __esModule: true,
    ...jest.requireActual('../LoggableEventsGQL'),
    default: () => <div>LoggableEventsGQL</div>
}));

describe('EventLoggerPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (options = {}) => {
        const { authValue = {}, viewOptionsValue = {} } = options;

        const defaultAuthValue = createMockAuthContextValue({
            user: createMockUser(),
            isOfflineMode: false,
            isInitializing: false,
            ...authValue
        });

        const defaultViewOptionsValue = createMockViewOptionsContextValue({
            theme: 'light',
            ...viewOptionsValue
        });

        return render(
            <AuthContext.Provider value={defaultAuthValue}>
                <ViewOptionsContext.Provider value={defaultViewOptionsValue}>
                    <EventLoggerPage />
                </ViewOptionsContext.Provider>
            </AuthContext.Provider>
        );
    };

    it('shows nothing while Apollo Client is being initialized', async () => {
        renderWithProviders();

        // Initially, should show nothing while Apollo Client loads
        expect(screen.queryByText('LoggableEventsGQL')).not.toBeInTheDocument();
        expect(screen.queryByText('Sign in to get started')).not.toBeInTheDocument();

        // Wait for Apollo Client to be initialized
        expect(await screen.findByText('LoggableEventsGQL')).toBeInTheDocument();
    });

    it('shows nothing while auth is initializing', () => {
        renderWithProviders({ authValue: { isInitializing: true } });

        expect(screen.queryByText('LoggableEventsGQL')).not.toBeInTheDocument();
        expect(screen.queryByText('Sign in to get started')).not.toBeInTheDocument();
    });

    it.each([
        ['authenticated user', { user: createMockUser() }, 'LoggableEventsGQL'],
        ['unauthenticated user', { user: null }, 'Sign in to get started'],
        ['authenticated user in offline mode', { isOfflineMode: true, user: offlineUser }, 'LoggableEventsGQL'],
        ['unauthenticated user in offline mode', { isOfflineMode: true, user: null }, 'Sign in to get started']
    ])('renders correct content for %s', async (_, authValue, expectedText) => {
        renderWithProviders({ authValue });
        expect(await screen.findByText(expectedText)).toBeInTheDocument();
    });

    it.each([
        ['light theme', 'light'],
        ['dark theme', 'dark']
    ])('renders with %s', async (_, theme) => {
        renderWithProviders({ viewOptionsValue: { theme } });
        expect(await screen.findByText('LoggableEventsGQL')).toBeInTheDocument();
    });
});
