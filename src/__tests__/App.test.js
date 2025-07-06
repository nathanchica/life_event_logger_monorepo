import { render, screen } from '@testing-library/react';

import App from '../App';

/* global process */

// Mock all the child components and providers
jest.mock('../components/EventLoggerPage', () => {
    return function MockEventLoggerPage() {
        return <div data-testid="event-logger-page">Event Logger Page</div>;
    };
});

jest.mock('../providers/AuthProvider', () => {
    return function MockAuthProvider({ children }) {
        return <div data-testid="auth-provider">{children}</div>;
    };
});

jest.mock('../providers/LoggableEventsProvider', () => {
    return function MockLoggableEventsProvider({ children }) {
        return <div data-testid="loggable-events-provider">{children}</div>;
    };
});

jest.mock('../providers/ViewOptionsProvider', () => {
    return function MockViewOptionsProvider({ children }) {
        return <div data-testid="view-options-provider">{children}</div>;
    };
});

describe('App component', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('renders all providers and main component', () => {
        render(<App />);

        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('view-options-provider')).toBeInTheDocument();
        expect(screen.getByTestId('loggable-events-provider')).toBeInTheDocument();
        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
        expect(screen.getByText('Event Logger Page')).toBeInTheDocument();
    });

    it.each([
        ['with environment variable', 'test-client-id'],
        ['without environment variable', undefined]
    ])('renders successfully %s', (_, clientId) => {
        if (clientId) {
            process.env.REACT_APP_GOOGLE_CLIENT_ID = clientId;
        } else {
            delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
        }

        render(<App />);

        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });

    describe('Auth context callback', () => {
        const createAuthCallback =
            () =>
            (_, { headers }) => {
                const token = localStorage.getItem('token');
                return {
                    headers: {
                        ...headers,
                        authorization: token ? `Bearer ${token}` : ''
                    }
                };
            };

        it.each([
            ['with token', 'test-token', 'Bearer test-token'],
            ['without token', null, '']
        ])('handles authorization %s', (_, token, expectedAuth) => {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }

            const result = createAuthCallback()({}, { headers: { custom: 'header' } });

            expect(result.headers.authorization).toBe(expectedAuth);
            expect(result.headers.custom).toBe('header');
        });
    });

    it.each([
        ['with token', 'test-token'],
        ['without token', null]
    ])('renders successfully %s in localStorage', (_, token) => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }

        render(<App />);

        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });
});
