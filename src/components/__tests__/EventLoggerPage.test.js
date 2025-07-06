import { render, screen } from '@testing-library/react';

import { createMockAuthContextValue, createMockViewOptionsContextValue } from '../../mocks/providers';
import { AuthContext } from '../../providers/AuthProvider';
import { ViewOptionsContext } from '../../providers/ViewOptionsProvider';
import EventLoggerPage from '../EventLoggerPage';

// Mock child components
jest.mock('../LoggableEventsGQL', () => {
    return function MockLoggableEventsGQL() {
        return <div data-testid="loggable-events-gql">Loggable Events GQL</div>;
    };
});

jest.mock('../LoggableEventsView', () => {
    return function MockLoggableEventsView({ offlineMode }) {
        return <div data-testid="loggable-events-view">Loggable Events View{offlineMode && ' (Offline Mode)'}</div>;
    };
});

jest.mock('../LoginView', () => {
    return function MockLoginView() {
        return <div data-testid="login-view">Login View</div>;
    };
});

describe('EventLoggerPage', () => {
    const renderWithProviders = (
        component,
        {
            authContextValue = createMockAuthContextValue(),
            viewOptionsContextValue = createMockViewOptionsContextValue()
        } = {}
    ) => {
        return render(
            <AuthContext.Provider value={authContextValue}>
                <ViewOptionsContext.Provider value={viewOptionsContextValue}>{component}</ViewOptionsContext.Provider>
            </AuthContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders LoginView when not authenticated and not offline', () => {
        const authContextValue = createMockAuthContextValue({
            isAuthenticated: false,
            isOfflineMode: false
        });

        renderWithProviders(<EventLoggerPage />, { authContextValue });

        expect(screen.getByTestId('login-view')).toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-gql')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-view')).not.toBeInTheDocument();
    });

    it.each([
        ['light mode', 'light'],
        ['dark mode', 'dark']
    ])('renders LoggableEventsView in %s with offline mode when in offline mode', (_, theme) => {
        const authContextValue = createMockAuthContextValue({
            isAuthenticated: false,
            isOfflineMode: true
        });
        const viewOptionsContextValue = createMockViewOptionsContextValue({
            theme
        });

        renderWithProviders(<EventLoggerPage />, { authContextValue, viewOptionsContextValue });

        expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        expect(screen.getByText('Loggable Events View (Offline Mode)')).toBeInTheDocument();
        expect(screen.queryByTestId('login-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-gql')).not.toBeInTheDocument();
    });

    it('renders LoggableEventsGQL when authenticated and not offline', () => {
        const authContextValue = createMockAuthContextValue({
            isAuthenticated: true,
            isOfflineMode: false
        });

        renderWithProviders(<EventLoggerPage />, { authContextValue });

        expect(screen.getByTestId('loggable-events-gql')).toBeInTheDocument();
        expect(screen.queryByTestId('login-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-view')).not.toBeInTheDocument();
    });

    it('prioritizes offline mode over authentication status', () => {
        const authContextValue = createMockAuthContextValue({
            isAuthenticated: true,
            isOfflineMode: true
        });

        renderWithProviders(<EventLoggerPage />, { authContextValue });

        expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        expect(screen.getByText('Loggable Events View (Offline Mode)')).toBeInTheDocument();
        expect(screen.queryByTestId('login-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-gql')).not.toBeInTheDocument();
    });

    it.each([
        ['not authenticated, not offline', false, false, 'login-view'],
        ['not authenticated, offline', false, true, 'loggable-events-view'],
        ['authenticated, not offline', true, false, 'loggable-events-gql'],
        ['authenticated, offline', true, true, 'loggable-events-view']
    ])('renders correct component when %s', (_, isAuthenticated, isOfflineMode, expectedTestId) => {
        const authContextValue = createMockAuthContextValue({
            isAuthenticated,
            isOfflineMode
        });

        renderWithProviders(<EventLoggerPage />, { authContextValue });

        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
    });
});
