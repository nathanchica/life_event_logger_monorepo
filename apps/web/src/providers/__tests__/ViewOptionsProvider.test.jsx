import { useContext } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { createMockViewOptionsContextValue } from '../../mocks/providers';
import ViewOptionsProvider, { ViewOptionsContext, useViewOptions } from '../ViewOptionsProvider';

vi.mock('@mui/material/useMediaQuery');

describe('ViewOptionsProvider', () => {
    let user;

    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();
        useMediaQuery.mockReturnValue(false);
    });

    // Helper function to capture context value
    const captureContextValue = () => {
        let contextValue;
        const TestComponent = () => {
            contextValue = useContext(ViewOptionsContext);
            return null;
        };
        return { TestComponent, getContextValue: () => contextValue };
    };

    // Helper function to render with provider
    const renderWithProvider = (children) => {
        return render(<ViewOptionsProvider>{children}</ViewOptionsProvider>);
    };

    describe('Component rendering', () => {
        it('renders children correctly', () => {
            renderWithProvider(<div>Test Child Component</div>);

            expect(screen.getByText('Test Child Component')).toBeInTheDocument();
        });

        it('provides context value to children', () => {
            const { TestComponent, getContextValue } = captureContextValue();
            renderWithProvider(<TestComponent />);

            expect(getContextValue()).toMatchObject({
                theme: 'light',
                enableLightTheme: expect.any(Function),
                enableDarkTheme: expect.any(Function),
                activeEventLabelId: null,
                setActiveEventLabelId: expect.any(Function),
                snackbarMessage: null,
                snackbarDuration: 5000,
                showSnackbar: expect.any(Function),
                hideSnackbar: expect.any(Function)
            });
        });
    });

    describe('Theme management', () => {
        it.each([
            ['light mode preference', false, 'light'],
            ['dark mode preference', true, 'dark']
        ])('initializes with %s', (_, mediaQueryResult, expectedTheme) => {
            useMediaQuery.mockReturnValue(mediaQueryResult);
            const { TestComponent, getContextValue } = captureContextValue();
            renderWithProvider(<TestComponent />);

            expect(getContextValue().theme).toBe(expectedTheme);
        });

        it.each([
            [
                'switches to light theme when enableLightTheme is called',
                true,
                'dark',
                'enableLightTheme',
                'Enable Light Theme',
                'light'
            ],
            [
                'switches to dark theme when enableDarkTheme is called',
                false,
                'light',
                'enableDarkTheme',
                'Enable Dark Theme',
                'dark'
            ]
        ])('%s', async (_, mediaQueryResult, initialTheme, methodName, buttonText, finalTheme) => {
            useMediaQuery.mockReturnValue(mediaQueryResult);

            const TestComponent = () => {
                const context = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Current theme: {context.theme}</span>
                        <button onClick={context[methodName]}>{buttonText}</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            expect(screen.getByText(`Current theme: ${initialTheme}`)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: new RegExp(buttonText, 'i') }));

            expect(screen.getByText(`Current theme: ${finalTheme}`)).toBeInTheDocument();
        });
    });

    describe('Active event label management', () => {
        it('initializes activeEventLabelId as null', () => {
            const { TestComponent, getContextValue } = captureContextValue();
            renderWithProvider(<TestComponent />);

            expect(getContextValue().activeEventLabelId).toBeNull();
        });

        it('updates activeEventLabelId when setActiveEventLabelId is called', async () => {
            const TestComponent = () => {
                const { activeEventLabelId, setActiveEventLabelId } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Active ID: {activeEventLabelId || 'none'}</span>
                        <button onClick={() => setActiveEventLabelId('label-123')}>Set Active Label</button>
                        <button onClick={() => setActiveEventLabelId(null)}>Clear Active Label</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            expect(screen.getByText('Active ID: none')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /set active label/i }));
            expect(screen.getByText('Active ID: label-123')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /clear active label/i }));
            expect(screen.getByText('Active ID: none')).toBeInTheDocument();
        });
    });

    describe('useViewOptions hook', () => {
        it('returns context value when used inside provider', () => {
            let hookResult;
            const TestComponent = () => {
                hookResult = useViewOptions();
                return null;
            };

            renderWithProvider(<TestComponent />);

            expect(hookResult).toMatchObject({
                theme: 'light',
                enableLightTheme: expect.any(Function),
                enableDarkTheme: expect.any(Function),
                activeEventLabelId: null,
                setActiveEventLabelId: expect.any(Function),
                snackbarMessage: null,
                snackbarDuration: 5000,
                showSnackbar: expect.any(Function),
                hideSnackbar: expect.any(Function)
            });
        });

        it('throws error when used outside provider', () => {
            const TestComponent = () => {
                useViewOptions();
                return null;
            };

            // Mock console.error to suppress the error output in the test runner
            const consoleError = vi.spyOn(console, 'error').mockImplementation();

            expect(() => {
                render(<TestComponent />);
            }).toThrow('This component must be wrapped by ViewOptionsProvider');

            consoleError.mockRestore();
        });
    });

    describe('Snackbar management', () => {
        it('initializes snackbar state correctly', () => {
            const { TestComponent, getContextValue } = captureContextValue();
            renderWithProvider(<TestComponent />);

            expect(getContextValue().snackbarMessage).toBeNull();
            expect(getContextValue().snackbarDuration).toBe(5000);
        });

        it('shows snackbar with default duration when showSnackbar is called', async () => {
            const TestComponent = () => {
                const { snackbarMessage, snackbarDuration, showSnackbar } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Message: {snackbarMessage || 'none'}</span>
                        <span>Duration: {snackbarDuration}</span>
                        <button onClick={() => showSnackbar('Test notification')}>Show Snackbar</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            expect(screen.getByText('Message: none')).toBeInTheDocument();
            expect(screen.getByText('Duration: 5000')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /show snackbar/i }));

            expect(screen.getByText('Message: Test notification')).toBeInTheDocument();
            expect(screen.getByText('Duration: 5000')).toBeInTheDocument();
        });

        it('shows snackbar with custom duration when specified', async () => {
            const TestComponent = () => {
                const { snackbarMessage, snackbarDuration, showSnackbar } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Message: {snackbarMessage || 'none'}</span>
                        <span>Duration: {snackbarDuration}</span>
                        <button onClick={() => showSnackbar('Custom duration', 3000)}>Show Custom</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            await user.click(screen.getByRole('button', { name: /show custom/i }));

            expect(screen.getByText('Message: Custom duration')).toBeInTheDocument();
            expect(screen.getByText('Duration: 3000')).toBeInTheDocument();
        });

        it('hides snackbar when hideSnackbar is called', async () => {
            const TestComponent = () => {
                const { snackbarMessage, showSnackbar, hideSnackbar } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Message: {snackbarMessage || 'none'}</span>
                        <button onClick={() => showSnackbar('Visible message')}>Show</button>
                        <button onClick={hideSnackbar}>Hide</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            // Show snackbar
            await user.click(screen.getByRole('button', { name: /show/i }));
            expect(screen.getByText('Message: Visible message')).toBeInTheDocument();

            // Hide snackbar
            await user.click(screen.getByRole('button', { name: /hide/i }));
            expect(screen.getByText('Message: none')).toBeInTheDocument();
        });

        it.each([
            ['short message', 'OK', 1000],
            ['normal message', 'Operation completed successfully', 5000],
            ['long message', 'This is a very long notification message that provides detailed information', 8000]
        ])('handles %s with duration %dms', async (_, message, duration) => {
            const TestComponent = () => {
                const { snackbarMessage, snackbarDuration, showSnackbar } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Message: {snackbarMessage || 'none'}</span>
                        <span>Duration: {snackbarDuration}</span>
                        <button onClick={() => showSnackbar(message, duration)}>Show</button>
                    </div>
                );
            };

            renderWithProvider(<TestComponent />);

            await user.click(screen.getByRole('button', { name: /show/i }));

            expect(screen.getByText(`Message: ${message}`)).toBeInTheDocument();
            expect(screen.getByText(`Duration: ${duration}`)).toBeInTheDocument();
        });
    });

    describe('Media query integration', () => {
        it('checks for dark mode preference on mount', () => {
            renderWithProvider(<div>Test</div>);

            expect(useMediaQuery).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
        });
    });

    describe('Context value using mock provider', () => {
        it('allows testing with mock context values', async () => {
            const mockSetActiveEventLabelId = vi.fn();
            const mockEnableLightTheme = vi.fn();
            const mockEnableDarkTheme = vi.fn();
            const mockShowSnackbar = vi.fn();
            const mockHideSnackbar = vi.fn();

            const mockContextValue = createMockViewOptionsContextValue({
                theme: 'dark',
                activeEventLabelId: 'mock-label-id',
                setActiveEventLabelId: mockSetActiveEventLabelId,
                enableLightTheme: mockEnableLightTheme,
                enableDarkTheme: mockEnableDarkTheme,
                snackbarMessage: 'Test message',
                snackbarDuration: 3000,
                showSnackbar: mockShowSnackbar,
                hideSnackbar: mockHideSnackbar
            });

            const TestComponent = () => {
                const context = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Theme: {context.theme}</span>
                        <span>Active Label: {context.activeEventLabelId}</span>
                        <button onClick={() => context.setActiveEventLabelId('new-id')}>Update Label</button>
                        <button onClick={context.enableLightTheme}>Light Theme</button>
                        <button onClick={context.enableDarkTheme}>Dark Theme</button>
                        <button onClick={() => context.showSnackbar('New message', 2000)}>Show Snackbar</button>
                        <button onClick={context.hideSnackbar}>Hide Snackbar</button>
                        <span>Snackbar: {context.snackbarMessage}</span>
                        <span>Duration: {context.snackbarDuration}</span>
                    </div>
                );
            };

            render(
                <ViewOptionsContext.Provider value={mockContextValue}>
                    <TestComponent />
                </ViewOptionsContext.Provider>
            );

            expect(screen.getByText('Theme: dark')).toBeInTheDocument();
            expect(screen.getByText('Active Label: mock-label-id')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /update label/i }));
            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith('new-id');

            await user.click(screen.getByRole('button', { name: /light theme/i }));
            expect(mockEnableLightTheme).toHaveBeenCalled();

            await user.click(screen.getByRole('button', { name: /dark theme/i }));
            expect(mockEnableDarkTheme).toHaveBeenCalled();

            expect(screen.getByText('Snackbar: Test message')).toBeInTheDocument();
            expect(screen.getByText('Duration: 3000')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /show snackbar/i }));
            expect(mockShowSnackbar).toHaveBeenCalledWith('New message', 2000);

            await user.click(screen.getByRole('button', { name: /hide snackbar/i }));
            expect(mockHideSnackbar).toHaveBeenCalled();
        });
    });
});
