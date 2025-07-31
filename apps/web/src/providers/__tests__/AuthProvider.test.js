import { useContext, useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { tokenStorage } from '../../apollo/tokenStorage';
import { createMockUser } from '../../mocks/user';
import AuthProvider, { AuthContext, useAuth } from '../AuthProvider';

// Mock tokenStorage
jest.mock('../../apollo/tokenStorage');

// Mock useAuthMutations hook
const mockLoginMutation = jest.fn();
const mockRefreshTokenMutation = jest.fn();
const mockLogoutMutation = jest.fn();

jest.mock('../../hooks/useAuthMutations', () => ({
    useAuthMutations: () => ({
        loginMutation: mockLoginMutation,
        refreshTokenMutation: mockRefreshTokenMutation,
        logoutMutation: mockLogoutMutation
    })
}));

const mockGoogleToken = 'google-oauth-token';

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
    const { user, token, isAuthenticated, isOfflineMode, isInitializing, login, logout, setOfflineMode, refreshAuth } =
        useAuth();
    const [loginResult, setLoginResult] = useState(null);
    const [refreshResult, setRefreshResult] = useState(null);

    const handleLogin = async () => {
        const success = await login(mockGoogleToken);
        setLoginResult(success);
    };

    const handleRefresh = async () => {
        const success = await refreshAuth();
        setRefreshResult(success);
    };

    return (
        <div>
            <span>User: {user?.name || 'none'}</span>
            <span>Token: {token || 'none'}</span>
            <span>Authenticated: {isAuthenticated ? 'yes' : 'no'}</span>
            <span>Login Result: {loginResult === null ? 'not attempted' : loginResult ? 'success' : 'failed'}</span>
            <span>
                Refresh Result: {refreshResult === null ? 'not attempted' : refreshResult ? 'success' : 'failed'}
            </span>
            <span>Offline Mode: {isOfflineMode ? 'yes' : 'no'}</span>
            <span>Initializing: {isInitializing ? 'yes' : 'no'}</span>

            <button onClick={() => setOfflineMode(true)}>Enable Offline Mode</button>
            <button onClick={() => setOfflineMode(false)}>Disable Offline Mode</button>
            <button onClick={handleLogin}>Login</button>
            <button onClick={logout}>Logout</button>
            <button onClick={handleRefresh}>Refresh</button>
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

        // Default mock implementations
        mockLogoutMutation.mockResolvedValue({});
        mockRefreshTokenMutation.mockResolvedValue({ data: null });

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
                token: null,
                isAuthenticated: false,
                isOfflineMode: false,
                isInitializing: false,
                login: expect.any(Function),
                logout: expect.any(Function),
                setOfflineMode: expect.any(Function),
                refreshAuth: expect.any(Function)
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
                token: null,
                isAuthenticated: false,
                isOfflineMode: false,
                isInitializing: false,
                login: expect.any(Function),
                logout: expect.any(Function),
                setOfflineMode: expect.any(Function),
                refreshAuth: expect.any(Function)
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

    describe('Login functionality', () => {
        it('handles successful login via Google OAuth', async () => {
            const mockUser = createMockUser({ name: 'Test User' });
            const mockToken = 'test-token-123';

            mockLoginMutation.mockResolvedValue({
                data: {
                    googleOAuthLoginMutation: {
                        accessToken: mockToken,
                        user: mockUser
                    }
                }
            });

            renderWithAuthProvider(<TestComponentWithAuth />);

            expect(screen.getByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Token: none')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: no')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('User: Test User')).toBeInTheDocument();
            expect(screen.getByText(`Token: ${mockToken}`)).toBeInTheDocument();
            expect(screen.getByText('Authenticated: yes')).toBeInTheDocument();
            expect(screen.getByText('Login Result: success')).toBeInTheDocument();

            expect(mockLoginMutation).toHaveBeenCalledWith({
                variables: {
                    input: {
                        googleToken: mockGoogleToken,
                        clientType: 'WEB'
                    }
                }
            });
            expect(tokenStorage.setAccessToken).toHaveBeenCalledWith(mockToken);
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
        });

        it.each([
            ['single error', [{ message: 'Invalid Google token' }]],
            [
                'multiple errors',
                [
                    { message: 'Invalid Google token', code: 'INVALID_TOKEN' },
                    { message: 'Token expired', code: 'TOKEN_EXPIRED' }
                ]
            ]
        ])('handles failed login with %s', async (_, errors) => {
            mockLoginMutation.mockResolvedValue({
                data: {
                    googleOAuthLoginMutation: {
                        accessToken: null,
                        user: null,
                        errors
                    }
                }
            });

            renderWithAuthProvider(<TestComponentWithAuth />);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('Login Result: failed')).toBeInTheDocument();
            expect(screen.getByText('User: none')).toBeInTheDocument();

            // Should log the first error message
            expect(mockConsoleError).toHaveBeenCalledWith('Login error:', errors[0].message);
            expect(tokenStorage.setAccessToken).not.toHaveBeenCalled();
            expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('handles login response without accessToken or errors', async () => {
            mockLoginMutation.mockResolvedValue({
                data: {
                    googleOAuthLoginMutation: {
                        accessToken: null,
                        user: null,
                        errors: []
                    }
                }
            });

            renderWithAuthProvider(<TestComponentWithAuth />);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('Login Result: failed')).toBeInTheDocument();

            // Should not log any error since there are no errors in the response
            expect(mockConsoleError).not.toHaveBeenCalledWith('Login error:', expect.any(String));
            expect(tokenStorage.setAccessToken).not.toHaveBeenCalled();
        });

        it.each([
            ['network error', new Error('Network error')],
            ['timeout error', new Error('Request timeout')]
        ])('handles login mutation %s', async (_, error) => {
            mockLoginMutation.mockRejectedValue(error);

            renderWithAuthProvider(<TestComponentWithAuth />);
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('Login Result: failed')).toBeInTheDocument();
            expect(screen.getByText('User: none')).toBeInTheDocument();

            expect(mockConsoleError).toHaveBeenCalledWith('Login failed:', error);
            expect(tokenStorage.setAccessToken).not.toHaveBeenCalled();
            expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    describe('Logout functionality', () => {
        it('clears state, sessionStorage and tokenStorage when logout is called', async () => {
            const mockUser = createMockUser();
            const mockToken = 'test-token-123';

            // Mock successful login first
            mockLoginMutation.mockResolvedValue({
                data: {
                    googleOAuthLoginMutation: {
                        accessToken: mockToken,
                        user: mockUser
                    }
                }
            });

            renderWithAuthProvider(<TestComponentWithAuth />);

            // First login
            await user.click(screen.getByRole('button', { name: /login/i }));

            expect(await screen.findByText('User: Test User')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: yes')).toBeInTheDocument();

            // Then logout
            await user.click(screen.getByRole('button', { name: /logout/i }));

            expect(await screen.findByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Authenticated: no')).toBeInTheDocument();

            expect(mockLogoutMutation).toHaveBeenCalled();
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
        });

        it('clears offline mode and URL on logout', async () => {
            renderWithAuthProvider(<TestComponentWithAuth />);

            // Enable offline mode first
            await user.click(screen.getByRole('button', { name: /enable offline mode/i }));
            expect(screen.getByText('Offline Mode: yes')).toBeInTheDocument();

            // Then logout should clear offline mode
            await user.click(screen.getByRole('button', { name: /logout/i }));

            expect(await screen.findByText('Offline Mode: no')).toBeInTheDocument();

            expect(window.history.replaceState).toHaveBeenCalledWith({}, '', expect.not.stringContaining('offline'));
        });

        it('handles logout mutation error gracefully', async () => {
            // Mock logout mutation error
            mockLogoutMutation.mockRejectedValue(new Error('Logout failed'));

            renderWithAuthProvider(<TestComponentWithAuth />);

            await user.click(screen.getByRole('button', { name: /logout/i }));

            await waitFor(() => {
                expect(mockConsoleError).toHaveBeenCalledWith('Logout error:', expect.any(Error));
            });

            // Should still clear local state even if mutation fails
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
        });
    });

    describe('Refresh Auth functionality', () => {
        it.each([
            [
                'successful refresh',
                { data: { refreshTokenMutation: { accessToken: 'new-access-token-456' } } },
                'success',
                'new-access-token-456',
                true
            ],
            ['failed refresh with null data', { data: null }, 'failed', 'none', false],
            ['failed refresh with no accessToken', { data: { refreshTokenMutation: {} } }, 'failed', 'none', false]
        ])('handles %s', async (_, mockResponse, expectedResult, expectedTokenDisplay, shouldSetToken) => {
            mockRefreshTokenMutation.mockResolvedValue(mockResponse);

            renderWithAuthProvider(<TestComponentWithAuth />);
            await user.click(screen.getByRole('button', { name: /refresh/i }));

            expect(await screen.findByText(`Refresh Result: ${expectedResult}`)).toBeInTheDocument();

            expect(mockRefreshTokenMutation).toHaveBeenCalled();
            expect(screen.getByText(`Token: ${expectedTokenDisplay}`)).toBeInTheDocument();
            expect(tokenStorage.setAccessToken).toHaveBeenCalledTimes(shouldSetToken ? 1 : 0);
        });

        it('handles refresh token mutation error', async () => {
            mockRefreshTokenMutation.mockRejectedValue(new Error('Network error'));

            renderWithAuthProvider(<TestComponentWithAuth />);
            await user.click(screen.getByRole('button', { name: /refresh/i }));

            expect(await screen.findByText('Refresh Result: failed')).toBeInTheDocument();

            expect(mockConsoleError).toHaveBeenCalledWith('Token refresh failed:', expect.any(Error));
            expect(tokenStorage.setAccessToken).not.toHaveBeenCalled();
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
            expect(screen.getByText('Token: none')).toBeInTheDocument();
            expect(screen.getByText('Offline Mode: no')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /enable offline mode/i }));

            expect(screen.getByText('User: Offline User')).toBeInTheDocument();
            expect(screen.getByText('Token: offline-token')).toBeInTheDocument();
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

        it('attempts to refresh token when user is in sessionStorage', async () => {
            const mockUser = createMockUser();

            // Set up sessionStorage with user
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            // Mock successful refresh
            mockRefreshTokenMutation.mockResolvedValue({
                data: {
                    refreshTokenMutation: {
                        accessToken: 'refreshed-token'
                    }
                }
            });

            renderWithAuthProvider(<TestComponentWithAuth />);

            // Should attempt refresh
            await waitFor(() => {
                expect(mockRefreshTokenMutation).toHaveBeenCalled();
            });

            // Should set user and token after successful refresh
            expect(await screen.findByText('Initializing: no')).toBeInTheDocument();
            expect(screen.getByText('User: Test User')).toBeInTheDocument();
            expect(screen.getByText('Token: refreshed-token')).toBeInTheDocument();
        });

        it('clears user data when refresh fails', async () => {
            const mockUser = createMockUser();

            // Set up sessionStorage with user
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            // Mock failed refresh
            mockRefreshTokenMutation.mockResolvedValue({
                data: null
            });

            renderWithAuthProvider(<TestComponentWithAuth />);

            // Should attempt refresh
            await waitFor(() => {
                expect(mockRefreshTokenMutation).toHaveBeenCalled();
            });

            // Should clear user data after failed refresh
            expect(await screen.findByText('Initializing: no')).toBeInTheDocument();
            expect(screen.getByText('User: none')).toBeInTheDocument();
            expect(screen.getByText('Token: none')).toBeInTheDocument();
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
        });
    });

    describe('Initial state from sessionStorage', () => {
        it('loads user from sessionStorage on mount and attempts refresh', async () => {
            const mockUser = createMockUser();

            // Set up sessionStorage before rendering
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return JSON.stringify(mockUser);
                return null;
            });

            // Mock failed refresh to test initial state
            mockRefreshTokenMutation.mockResolvedValue({
                data: null
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            // Initially user is loaded from sessionStorage
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith('user');
            expect(contextValue.user).toEqual(mockUser);

            // But no token yet and will attempt refresh
            await waitFor(() => {
                expect(mockRefreshTokenMutation).toHaveBeenCalled();
            });

            // After failed refresh, user is cleared
            await waitFor(() => {
                expect(contextValue.user).toBeNull();
                expect(contextValue.token).toBeNull();
                expect(contextValue.isAuthenticated).toBe(false);
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
                expect(contextValue.token).toBeNull();
                expect(contextValue.isAuthenticated).toBe(false);
            });
        });

        it.each([
            ['no stored data', null, false],
            ['user stored', JSON.stringify(createMockUser()), false] // false because no token until refresh succeeds
        ])('handles %s correctly', async (_, storedUser, shouldAuthenticate) => {
            // Set up sessionStorage mock
            sessionStorageMock.getItem.mockImplementation((key) => {
                if (key === 'user') return storedUser;
                return null;
            });

            // Mock failed refresh
            mockRefreshTokenMutation.mockResolvedValue({
                data: null
            });

            let contextValue;
            const TestComponent = () => {
                contextValue = useAuth();
                return null;
            };
            renderWithAuthProvider(<TestComponent />);

            await waitFor(() => {
                expect(contextValue.isAuthenticated).toBe(shouldAuthenticate);
                expect(contextValue.isInitializing).toBe(false);
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
                expect(contextValue.token).toBe('offline-token');
                expect(contextValue.isInitializing).toBe(false);
            });

            expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('offline-token');
            expect(mockConsoleInfo).toHaveBeenCalledWith('Application is in offline mode.');
        });
    });
});
