import { render, screen } from '@testing-library/react';

import App from '../App';

jest.mock('../components/EventLoggerPage', () => {
    return function MockEventLoggerPage() {
        return <div data-testid="event-logger-page">Event Logger Page</div>;
    };
});

jest.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children, clientId }) => (
        <div data-testid="google-oauth-provider" data-client-id={clientId}>
            {children}
        </div>
    )
}));

describe('App', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('renders the main application with all providers', () => {
        process.env.REACT_APP_GOOGLE_CLIENT_ID = 'test-client-id';

        render(<App />);

        expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });

    it('handles missing Google client ID environment variable', () => {
        delete process.env.REACT_APP_GOOGLE_CLIENT_ID;

        render(<App />);

        expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });
});
