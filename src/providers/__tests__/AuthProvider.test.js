import { useContext } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import AuthProvider, { AuthContext, useAuth } from '../AuthProvider';

// Create localStorage mock
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

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

describe('AuthProvider', () => {
    const originalLocation = window.location;
    let mockConsoleInfo;
    let mockConsoleError;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        localStorageMock._reset();
        delete window.location;
        window.location = { ...originalLocation, search: '' };
        mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        window.location = originalLocation;
        mockConsoleInfo.mockRestore();
        mockConsoleError.mockRestore();
    });

    describe('Component rendering', () => {
        it('renders children correctly', () => {
            render(
                <AuthProvider>
                    <div>Test Child Component</div>
                </AuthProvider>
            );

            expect(screen.getByText('Test Child Component')).toBeInTheDocument();
        });

        it('provides context value to children', () => {
            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue).toMatchObject({
                user: null,
                token: null,
                isAuthenticated: false,
                isOfflineMode: false,
                login: expect.any(Function),
                logout: expect.any(Function),
                setOfflineMode: expect.any(Function)
            });
        });
    });

    describe('Login functionality', () => {
        it('updates state and localStorage when login is called', () => {
            const mockUser = createMockUser();
            const mockToken = 'test-token-123';

            const TestComponent = () => {
                const { user, token, isAuthenticated, login } = useContext(AuthContext);
                return (
                    <div>
                        <span>User: {user?.name || 'none'}</span>
                        <span>Token: {token || 'none'}</span>
                        <span>Authenticated: {isAuthenticated ? 'yes' : 'no'}</span>
                        <button onClick={() => login(mockToken, mockUser)}>Login</button>
                    </div>
                );
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(screen.getByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Token: none')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: no')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /login/i }));

            expect(screen.getByText('User: Test User')).toBeInTheDocument();
            expect(screen.getByText('Token: test-token-123')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: yes')).toBeInTheDocument();

            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
        });

        it.each([
            ['standard user', { id: 'user-1', email: 'user1@test.com', name: 'User One' }, 'token-1'],
            ['admin user', { id: 'admin-1', email: 'admin@test.com', name: 'Admin User' }, 'admin-token'],
            ['guest user', { id: 'guest-1', email: 'guest@test.com', name: 'Guest User' }, 'guest-token']
        ])('handles login for %s', (_, userData, tokenData) => {
            const mockUser = createMockUser(userData);

            const TestComponent = () => {
                const { user, login } = useContext(AuthContext);
                return (
                    <div>
                        <span>User ID: {user?.id || 'none'}</span>
                        <span>User Email: {user?.email || 'none'}</span>
                        <button onClick={() => login(tokenData, mockUser)}>Login</button>
                    </div>
                );
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /login/i }));

            expect(screen.getByText(`User ID: ${userData.id}`)).toBeInTheDocument();
            expect(screen.getByText(`User Email: ${userData.email}`)).toBeInTheDocument();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', tokenData);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
        });
    });

    describe('Logout functionality', () => {
        it('clears state and localStorage when logout is called', () => {
            const mockUser = createMockUser();
            const mockToken = 'test-token-123';

            const TestComponent = () => {
                const { user, isAuthenticated, login, logout } = useContext(AuthContext);
                return (
                    <div>
                        <span>User: {user?.name || 'none'}</span>
                        <span>Authenticated: {isAuthenticated ? 'yes' : 'no'}</span>
                        <button onClick={() => login(mockToken, mockUser)}>Login</button>
                        <button onClick={logout}>Logout</button>
                    </div>
                );
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // First login
            userEvent.click(screen.getByRole('button', { name: /login/i }));
            expect(screen.getByText('User: Test User')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: yes')).toBeInTheDocument();

            // Then logout
            userEvent.click(screen.getByRole('button', { name: /logout/i }));
            expect(screen.getByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: no')).toBeInTheDocument();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
        });
    });

    describe('Offline mode functionality', () => {
        it('updates offline mode state when setOfflineMode is called', () => {
            const TestComponent = () => {
                const { isOfflineMode, setOfflineMode } = useContext(AuthContext);
                return (
                    <div>
                        <span>Offline Mode: {isOfflineMode ? 'yes' : 'no'}</span>
                        <button onClick={() => setOfflineMode(true)}>Enable Offline</button>
                        <button onClick={() => setOfflineMode(false)}>Disable Offline</button>
                    </div>
                );
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /enable offline/i }));
            expect(screen.getByText('Offline Mode: yes')).toBeInTheDocument();
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application switched to offline mode.');

            userEvent.click(screen.getByRole('button', { name: /disable offline/i }));
            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();
        });

        it.each([
            ['enables offline mode', true, 'yes'],
            ['disables offline mode', false, 'no']
        ])('%s correctly', (_, offlineValue, expectedDisplay) => {
            const TestComponent = () => {
                const { isOfflineMode, setOfflineMode } = useContext(AuthContext);
                return (
                    <div>
                        <span>Offline: {isOfflineMode ? 'yes' : 'no'}</span>
                        <button onClick={() => setOfflineMode(offlineValue)}>Update</button>
                    </div>
                );
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            userEvent.click(screen.getByRole('button', { name: /update/i }));
            expect(screen.getByText(`Offline: ${expectedDisplay}`)).toBeInTheDocument();
        });
    });

    describe('useAuth hook', () => {
        it('returns context value when used inside provider', () => {
            let hookResult;
            const TestComponent = () => {
                hookResult = useAuth();
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(hookResult).toMatchObject({
                user: null,
                token: null,
                isAuthenticated: false,
                isOfflineMode: false,
                login: expect.any(Function),
                logout: expect.any(Function),
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

    describe('Initial state from localStorage', () => {
        it('loads user and token from localStorage on mount', () => {
            const mockUser = createMockUser();
            const mockToken = 'stored-token';

            // Set up localStorage before rendering
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'token') return mockToken;
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
            expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
            expect(contextValue.user).toEqual(mockUser);
            expect(contextValue.token).toEqual(mockToken);
            expect(contextValue.isAuthenticated).toBe(true);
        });

        it('handles corrupted user data in localStorage', () => {
            // Set up localStorage with invalid JSON
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'token') return 'test-token';
                if (key === 'user') return 'invalid-json{';
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(mockConsoleError).toHaveBeenCalledWith('Error parsing stored user data:', expect.any(Error));
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
            expect(contextValue.user).toBeNull();
            expect(contextValue.token).toBeNull();
            expect(contextValue.isAuthenticated).toBe(false);
        });

        it.each([
            ['no stored data', null, null, false],
            ['only token stored', 'test-token', null, false],
            ['only user stored', null, JSON.stringify(createMockUser()), false],
            ['both stored', 'test-token', JSON.stringify(createMockUser()), true]
        ])('handles %s correctly', (_, storedToken, storedUser, shouldAuthenticate) => {
            // Set up localStorage mock
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'token') return storedToken;
                if (key === 'user') return storedUser;
                return null;
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.isAuthenticated).toBe(shouldAuthenticate);
        });
    });

    describe('URL parameter offline mode detection', () => {
        it('enables offline mode when offline URL parameter is present', () => {
            window.location.search = '?offline';

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.isOfflineMode).toBe(true);
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application is in offline mode.');
        });

        it.each([
            ['no parameters', ''],
            ['other parameters', '?other=value'],
            ['multiple parameters without offline', '?param1=value1&param2=value2']
        ])('does not enable offline mode with %s', (_, searchParams) => {
            window.location.search = searchParams;

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.isOfflineMode).toBe(false);
        });

        it('enables offline mode with offline parameter among other parameters', () => {
            window.location.search = '?param1=value1&offline&param2=value2';

            let contextValue;
            const TestComponent = () => {
                contextValue = useContext(AuthContext);
                return null;
            };

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(contextValue.isOfflineMode).toBe(true);
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application is in offline mode.');
        });
    });

    describe('Context value using mock provider', () => {
        it('allows testing with mock context values', () => {
            const mockLogin = jest.fn();
            const mockLogout = jest.fn();
            const mockSetOfflineMode = jest.fn();
            const mockUser = createMockUser({ name: 'Mock User' });

            const mockContextValue = createMockAuthContextValue({
                user: mockUser,
                token: 'mock-token',
                isAuthenticated: true,
                isOfflineMode: true,
                login: mockLogin,
                logout: mockLogout,
                setOfflineMode: mockSetOfflineMode
            });

            const TestComponent = () => {
                const context = useContext(AuthContext);
                return (
                    <div>
                        <span>User: {context.user?.name}</span>
                        <span>Token: {context.token}</span>
                        <span>Authenticated: {context.isAuthenticated ? 'yes' : 'no'}</span>
                        <span>Offline: {context.isOfflineMode ? 'yes' : 'no'}</span>
                        <button onClick={() => context.login('new-token', mockUser)}>Login</button>
                        <button onClick={context.logout}>Logout</button>
                        <button onClick={() => context.setOfflineMode(false)}>Go Online</button>
                    </div>
                );
            };

            render(
                <AuthContext.Provider value={mockContextValue}>
                    <TestComponent />
                </AuthContext.Provider>
            );

            expect(screen.getByText('User: Mock User')).toBeInTheDocument();
            expect(screen.getByText('Token: mock-token')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: yes')).toBeInTheDocument();
            expect(screen.getByText('Offline: yes')).toBeInTheDocument();

            userEvent.click(screen.getByRole('button', { name: /login/i }));
            expect(mockLogin).toHaveBeenCalledWith('new-token', mockUser);

            userEvent.click(screen.getByRole('button', { name: /logout/i }));
            expect(mockLogout).toHaveBeenCalled();

            userEvent.click(screen.getByRole('button', { name: /go online/i }));
            expect(mockSetOfflineMode).toHaveBeenCalledWith(false);
        });
    });
});
