import { useContext } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockViewOptionsContextValue } from '../../mocks/providers';
import ViewOptionsProvider, { ViewOptionsContext, useViewOptions } from '../ViewOptionsProvider';

jest.mock('@mui/material/useMediaQuery');

describe('ViewOptionsProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useMediaQuery.mockReturnValue(false);
    });

    describe('Component rendering', () => {
        it('renders children correctly', () => {
            render(
                <ViewOptionsProvider>
                    <div>Test Child Component</div>
                </ViewOptionsProvider>
            );

            expect(screen.getByText('Test Child Component')).toBeInTheDocument();
        });

        it('provides context value to children', () => {
            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(ViewOptionsContext);
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(contextValue).toMatchObject({
                theme: 'light',
                enableLightTheme: expect.any(Function),
                enableDarkTheme: expect.any(Function),
                activeEventLabelId: null,
                setActiveEventLabelId: expect.any(Function)
            });
        });
    });

    describe('Theme management', () => {
        it('initializes with light theme when user prefers light mode', () => {
            useMediaQuery.mockReturnValue(false);

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(ViewOptionsContext);
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(contextValue.theme).toBe('light');
        });

        it('initializes with dark theme when user prefers dark mode', () => {
            useMediaQuery.mockReturnValue(true);

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(ViewOptionsContext);
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(contextValue.theme).toBe('dark');
        });

        it('switches to light theme when enableLightTheme is called', async () => {
            useMediaQuery.mockReturnValue(true); // Start with dark preference

            const TestComponent = () => {
                const { theme, enableLightTheme } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Current theme: {theme}</span>
                        <button onClick={enableLightTheme}>Enable Light Theme</button>
                    </div>
                );
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(screen.getByText('Current theme: dark')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: /enable light theme/i }));

            expect(screen.getByText('Current theme: light')).toBeInTheDocument();
        });

        it('switches to dark theme when enableDarkTheme is called', async () => {
            useMediaQuery.mockReturnValue(false); // Start with light preference

            const TestComponent = () => {
                const { theme, enableDarkTheme } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Current theme: {theme}</span>
                        <button onClick={enableDarkTheme}>Enable Dark Theme</button>
                    </div>
                );
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(screen.getByText('Current theme: light')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: /enable dark theme/i }));

            expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
        });
    });

    describe('Active event label management', () => {
        it('initializes activeEventLabelId as null', () => {
            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(ViewOptionsContext);
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(contextValue.activeEventLabelId).toBeNull();
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

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(screen.getByText('Active ID: none')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: /set active label/i }));
            expect(screen.getByText('Active ID: label-123')).toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', { name: /clear active label/i }));
            expect(screen.getByText('Active ID: none')).toBeInTheDocument();
        });

        it.each([
            ['string ID', 'test-label-id', 'test-label-id'],
            ['another string ID', 'another-id', 'another-id'],
            ['null value', null, 'none']
        ])('handles %s correctly', async (description, setValue, expectedDisplay) => {
            const TestComponent = () => {
                const { activeEventLabelId, setActiveEventLabelId } = useContext(ViewOptionsContext);
                return (
                    <div>
                        <span>Active ID: {activeEventLabelId || 'none'}</span>
                        <button onClick={() => setActiveEventLabelId(setValue)}>Update</button>
                    </div>
                );
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            await userEvent.click(screen.getByRole('button', { name: /update/i }));
            expect(screen.getByText(`Active ID: ${expectedDisplay}`)).toBeInTheDocument();
        });
    });

    describe('useViewOptions hook', () => {
        it('returns context value when used inside provider', () => {
            let hookResult;
            const TestComponent = () => {
                hookResult = useViewOptions();
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(hookResult).toMatchObject({
                theme: 'light',
                enableLightTheme: expect.any(Function),
                enableDarkTheme: expect.any(Function),
                activeEventLabelId: null,
                setActiveEventLabelId: expect.any(Function)
            });
        });

        it('throws error when used outside provider', () => {
            const TestComponent = () => {
                useViewOptions();
                return null;
            };

            // Mock console.error to suppress the error output in the test runner
            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            expect(() => {
                render(<TestComponent />);
            }).toThrow('This component must be wrapped by ViewOptionsProvider');

            consoleError.mockRestore();
        });
    });

    describe('Media query integration', () => {
        it('checks for dark mode preference on mount', () => {
            render(
                <ViewOptionsProvider>
                    <div>Test</div>
                </ViewOptionsProvider>
            );

            expect(useMediaQuery).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
        });

        it.each([
            ['dark mode preference', true, 'dark'],
            ['light mode preference', false, 'light']
        ])('respects %s on initial render', (_, mediaQueryResult, expectedTheme) => {
            useMediaQuery.mockReturnValue(mediaQueryResult);

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(ViewOptionsContext);
                return null;
            };

            render(
                <ViewOptionsProvider>
                    <TestComponent />
                </ViewOptionsProvider>
            );

            expect(contextValue.theme).toBe(expectedTheme);
        });
    });

    describe('Context value using mock provider', () => {
        it('allows testing with mock context values', () => {
            const mockSetActiveEventLabelId = jest.fn();
            const mockEnableLightTheme = jest.fn();
            const mockEnableDarkTheme = jest.fn();

            const mockContextValue = createMockViewOptionsContextValue({
                theme: 'dark',
                activeEventLabelId: 'mock-label-id',
                setActiveEventLabelId: mockSetActiveEventLabelId,
                enableLightTheme: mockEnableLightTheme,
                enableDarkTheme: mockEnableDarkTheme
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

            userEvent.click(screen.getByRole('button', { name: /update label/i }));
            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith('new-id');

            userEvent.click(screen.getByRole('button', { name: /light theme/i }));
            expect(mockEnableLightTheme).toHaveBeenCalled();

            userEvent.click(screen.getByRole('button', { name: /dark theme/i }));
            expect(mockEnableDarkTheme).toHaveBeenCalled();
        });
    });
});
