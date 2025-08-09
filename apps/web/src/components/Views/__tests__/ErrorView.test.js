import useMediaQuery from '@mui/material/useMediaQuery';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ErrorView from '../ErrorView';

// Mock useMediaQuery to control theme preference
jest.mock('@mui/material/useMediaQuery');

/**
 * Creates a mock localStorage object
 */
const createLocalStorageMock = () => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        _reset: () => {
            store = {};
        }
    };
};

describe('ErrorView', () => {
    let user;
    const mockResetErrorBoundary = jest.fn();
    const mockError = new Error('Test error: Something went wrong!');
    const originalLocalStorage = window.localStorage;
    let localStorageMock;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();

        // Mock localStorage
        localStorageMock = createLocalStorageMock();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Pre-populate localStorage with apollo cache key
        localStorageMock.setItem('apollo-cache-persist', JSON.stringify({ test: 'data' }));
    });

    afterEach(() => {
        // Restore original localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
            configurable: true
        });
    });

    describe('Theme Modes', () => {
        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('renders error message and details in %s', (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);

            render(<ErrorView error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
            expect(screen.getByText(/chicanathan@gmail.com/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /clear my local data/i })).toBeInTheDocument();
        });

        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('calls resetErrorBoundary when Try Again is clicked in %s', async (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);

            render(<ErrorView error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

            const tryAgainButton = screen.getByRole('button', { name: /try again/i });
            await user.click(tryAgainButton);

            expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Details Display', () => {
        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('shows error details in development mode in %s', (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            render(<ErrorView error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

            // Check that error details are shown in development
            expect(screen.getByText(/Test error: Something went wrong!/)).toBeInTheDocument();

            process.env.NODE_ENV = originalNodeEnv;
        });

        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('does not show error details in production mode in %s', (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            render(<ErrorView error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

            // Check that error details are NOT shown in production
            expect(screen.queryByText(/Test error: Something went wrong!/)).not.toBeInTheDocument();
            // But error message should still be shown
            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

            process.env.NODE_ENV = originalNodeEnv;
        });

        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('shows error stack trace in development mode when available in %s', (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);
            const originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const errorWithStack = new Error('Test error with stack');
            errorWithStack.stack = 'Error: Test error with stack\n    at TestFunction (test.js:10:15)';

            render(<ErrorView error={errorWithStack} resetErrorBoundary={mockResetErrorBoundary} />);

            // Check that both message and stack are shown
            expect(screen.getByText(/Test error with stack/)).toBeInTheDocument();
            expect(screen.getByText(/at TestFunction/)).toBeInTheDocument();

            process.env.NODE_ENV = originalNodeEnv;
        });
    });

    describe('Clear Local Data functionality', () => {
        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('clears apollo cache from localStorage and resets error boundary in %s', async (_, prefersDarkMode) => {
            useMediaQuery.mockReturnValue(prefersDarkMode);

            render(<ErrorView error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

            // Verify apollo cache is in localStorage before clearing
            expect(localStorageMock.getItem('apollo-cache-persist')).toBeTruthy();

            const clearDataButton = screen.getByRole('button', { name: /clear my local data/i });
            await user.click(clearDataButton);

            // Should remove the apollo cache key
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('apollo-cache-persist');
            expect(localStorageMock.removeItem).toHaveBeenCalledTimes(1);

            // Should NOT clear all of localStorage
            expect(localStorageMock.clear).not.toHaveBeenCalled();

            // Should call resetErrorBoundary
            expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
        });
    });
});
