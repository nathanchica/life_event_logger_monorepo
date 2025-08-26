import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import App from '../App';

// Component that can throw errors on demand for testing
const TestComponent = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Test error: Component crashed!');
    }
    return <div data-testid="event-logger-page">Event Logger Page</div>;
};

// Mock EventLoggerPage with ability to control errors
let mockShouldThrow = false;
vi.mock('../components/EventLoggerPage', () => ({
    default: function MockEventLoggerPage() {
        const shouldThrow = mockShouldThrow;
        return <TestComponent shouldThrow={shouldThrow} />;
    }
}));

vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children, clientId }) => (
        <div data-testid="google-oauth-provider" data-client-id={clientId}>
            {children}
        </div>
    )
}));

describe('App', () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        mockShouldThrow = false;
        user = userEvent.setup();
    });

    it('renders the main application with all providers', () => {
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

        render(
            <MockedProvider>
                <App />
            </MockedProvider>
        );

        expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });

    it('handles missing Google client ID environment variable', () => {
        vi.stubEnv('VITE_GOOGLE_CLIENT_ID', undefined);

        render(
            <MockedProvider>
                <App />
            </MockedProvider>
        );

        expect(screen.getByTestId('google-oauth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('event-logger-page')).toBeInTheDocument();
    });

    describe('Error Boundary', () => {
        it('displays error view when a component throws an error', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            mockShouldThrow = true;
            vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

            render(
                <MockedProvider>
                    <App />
                </MockedProvider>
            );

            // Check that error view is displayed
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
            expect(screen.getByText(/chicanathan@gmail.com/)).toBeInTheDocument();

            // Check for button
            expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

            // Verify console.error was called with the error
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('allows user to try again after error', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            mockShouldThrow = true;
            vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');

            render(
                <MockedProvider>
                    <App />
                </MockedProvider>
            );

            // Verify error view is displayed
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

            // Reset mock to not throw on retry
            mockShouldThrow = false;

            // Click Try Again button
            const tryAgainButton = screen.getByRole('button', { name: /try again/i });
            await user.click(tryAgainButton);

            // Use findBy to wait for the app to re-render without error
            const eventLoggerPage = await screen.findByTestId('event-logger-page');
            expect(eventLoggerPage).toBeInTheDocument();

            // Verify error view is no longer displayed
            expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();

            consoleErrorSpy.mockRestore();
        });
    });
});
