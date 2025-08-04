import { useContext } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { tokenStorage } from '../../apollo/tokenStorage';
import { createMockUser } from '../../mocks/user';
import AuthProvider, { AuthContext, useAuth } from '../AuthProvider';

// Mock tokenStorage
jest.mock('../../apollo/tokenStorage');

/**
 * Creates a mock sessionStorage object
 */
const createSessionStorageMock = () => {
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

/**
 * Renders a component with AuthProvider
 */
const renderWithAuthProvider = (component) => {
    return render(<AuthProvider>{component}</AuthProvider>);
};

/**
 * Test component to check AuthContext values and actions
 */
const TestComponentWithAuth = () => {
    const { user, isOfflineMode, isInitializing, setAuthData, clearAuthData, setOfflineMode } = useAuth();

    const handleSetAuth = () => {
        const mockUser = createMockUser({ name: 'Test User' });
        setAuthData('test-token-123', mockUser);
    };

    return (
        <div>
            <span>User: {user?.name || 'none'}</span>
            <span>Offline Mode: {isOfflineMode ? 'yes' : 'no'}</span>
            <span>Initializing: {isInitializing ? 'yes' : 'no'}</span>

            <button onClick={() => setOfflineMode(true)}>Enable Offline Mode</button>
            <button onClick={() => setOfflineMode(false)}>Disable Offline Mode</button>
            <button onClick={handleSetAuth}>Set Auth</button>
            <button onClick={clearAuthData}>Clear Auth</button>
        </div>
    );
};

describe('AuthProvider', () => {
    const originalLocation = window.location;
    const originalSessionStorage = window.sessionStorage;
    let mockConsoleInfo;
    let mockConsoleError;
    let user;
    let sessionStorageMock;

    beforeEach(() => {
        // Reset all mocks
        jest.resetAllMocks();

        // Reset tokenStorage mocks
        tokenStorage.setAccessToken.mockClear();
        tokenStorage.clear.mockClear();

        // Mock window.location to control URL parameters
        delete window.location;
        window.location = {
            ...originalLocation,
            search: '',
            href: 'http://localhost:3000'
        };
        // Mock window.history.replaceState
        Object.defineProperty(window, 'history', {
            value: {
                replaceState: jest.fn()
            },
            writable: true
        });

        // Mock sessionStorage
        sessionStorageMock = createSessionStorageMock();
        Object.defineProperty(window, 'sessionStorage', {
            value: sessionStorageMock,
            writable: true
        });

        // Mock console methods
        mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

        // Create userEvent instance
        user = userEvent.setup();
    });

    afterEach(() => {
        // Restore original window.location and sessionStorage
        window.location = originalLocation;
        Object.defineProperty(window, 'sessionStorage', {
            value: originalSessionStorage,
            writable: true,
            configurable: true
        });

        // Restore console methods
        mockConsoleInfo.mockRestore();
        mockConsoleError.mockRestore();
    });

    describe('Component rendering', () => {
        it('renders children correctly', () => {
            renderWithAuthProvider(<div>Test Child Component</div>);
            expect(screen.getByText('Test Child Component')).toBeInTheDocument();
        });

        it('provides context value to children', () => {
            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            renderWithAuthProvider(<TestComponent />);

            expect(contextValue).toMatchObject({
                user: null,
                isOfflineMode: false,
                isInitializing: false,
                setAuthData: expect.any(Function),
                clearAuthData: expect.any(Function),
                setOfflineMode: expect.any(Function)
            });
        });
    });

    describe('useAuth hook', () => {
        it('returns context value when used inside provider', () => {
            let hookResult;
            const TestComponent = () => {
                hookResult = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            expect(hookResult).toMatchObject({
                user: null,
                isOfflineMode: false,
                isInitializing: false,
                setAuthData: expect.any(Function),
                clearAuthData: expect.any(Function),
                setOfflineMode: expect.any(Function)
            });
        });

        it('throws error when used outside provider', () => {
            const TestComponent = () => {
                useAuth();
                return null;
            };

            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            expect(() => {
                render(<TestComponent />);
            }).toThrow('This component must be used within an AuthProvider');

            consoleError.mockRestore();
        });
    });

    describe('Auth state management', () => {
        it('sets auth data correctly when setAuthData is called', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            expect(screen.getByText('User: none')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /set auth/i }));

            expect(await screen.findByText('User: Test User')).toBeInTheDocument();

            expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('test-token-123');
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
                'user',
                JSON.stringify({
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User'
                })
            );
        });
    });

    describe('Clear auth functionality', () => {
        it('clears state, sessionStorage and tokenStorage when clearAuthData is called', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            // First set auth
            await user.click(screen.getByRole('button', { name: /set auth/i }));

            expect(await screen.findByText('User: Test User')).toBeInTheDocument();

            // Then clear auth
            await user.click(screen.getByRole('button', { name: /clear auth/i }));

            expect(await screen.findByText('User: none')).toBeInTheDocument();

            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
        });

        it('clears offline mode and URL on clearAuthData', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            // Enable offline mode first
            await user.click(screen.getByRole('button', { name: /enable offline mode/i }));
            expect(screen.getByText('Offline Mode: yes')).toBeInTheDocument();

            // Then clear auth should clear offline mode
            await user.click(screen.getByRole('button', { name: /clear auth/i }));

            expect(await screen.findByText('Offline Mode: no')).toBeInTheDocument();

            expect(window.history.replaceState).toHaveBeenCalledWith({}, '', expect.not.stringContaining('offline'));
        });
    });

    describe('Offline mode functionality', () => {
        it('updates offline mode state when setOfflineMode is called', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /enable offline mode/i }));
            expect(screen.getByText('Offline Mode: yes')).toBeInTheDocument();
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application switched to offline mode.');
            expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:3000/?offline=true');

            await user.click(screen.getByRole('button', { name: /disable offline mode/i }));
            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();
        });

        it('sets offline user and token when enabling offline mode', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            expect(screen.getByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /enable offline mode/i }));

            expect(screen.getByText('User: Offline User')).toBeInTheDocument();
            expect(screen.getByText('Offline Mode: yes')).toBeInTheDocument();
            expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('offline-token');
            expect(window.history.replaceState).toHaveBeenCalledWith({}, '', expect.stringContaining('offline=true'));
        });
    });

    describe('Initialization state', () => {
        it('sets isInitializing to false after mounting', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            // After initial render, should be false (since no async operations)
            expect(await screen.findByText('Initializing: no')).toBeInTheDocument();
        });

        it('loads user from sessionStorage without token', async () => {
            const mockUser = createMockUser();

            // Set up sessionStorage with user
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            renderWithAuthProvider(<TestComponentWithAuth />);

            // Should load user (refresh will happen elsewhere)
            expect(await screen.findByText('Initializing: no')).toBeInTheDocument();
            expect(screen.getByText('User: Test User')).toBeInTheDocument();
        });
    });

    describe('Initial state from sessionStorage', () => {
        it('loads user from sessionStorage on mount', async () => {
            const mockUser = createMockUser();

            // Set up sessionStorage before rendering
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            // User is loaded from sessionStorage
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith('user');
            expect(contextValue.user).toEqual(mockUser);

            await waitFor(() => {
                expect(contextValue.isInitializing).toBe(false);
            });
        });

        it('handles corrupted user data in sessionStorage', async () => {
            // Set up sessionStorage with invalid JSON
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return 'invalid-json{';
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            await waitFor(() => {
                expect(mockConsoleError).toHaveBeenCalledWith('Error parsing stored user data:', expect.any(Error));
                expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
                expect(contextValue.user).toBeNull();
            });
        });

        it.each([
            ['no stored data', null],
            ['user stored', createMockUser()]
        ])('handles %s correctly', async (_, storedUser) => {
            // Set up sessionStorage mock
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return storedUser ? JSON.stringify(storedUser) : null;
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            await waitFor(() => {
                expect(contextValue.isInitializing).toBe(false);
                expect(contextValue.user).toEqual(storedUser);
            });
        });
    });

    describe('URL parameter offline mode detection', () => {
        it('enables offline mode when offline URL parameter is present', async () => {
            window.location.search = '?offline';

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            await waitFor(() => {
                expect(contextValue.isOfflineMode).toBe(true);
                expect(contextValue.user?.name).toBe('Offline User');
                expect(contextValue.isInitializing).toBe(false);
            });

            expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('offline-token');
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application is in offline mode.');
        });
    });
});
