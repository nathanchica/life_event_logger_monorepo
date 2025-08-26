import { act } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { createMockAuthContextValue } from '../../../mocks/providers';
import { AuthContext } from '../../../providers/AuthProvider';
import LoginView from '../LoginView';

// Hoist the mock variable so it's available when vi.mock runs
const { mockLoginMutation } = vi.hoisted(() => {
    return {
        mockLoginMutation: vi.fn()
    };
});

// Mock useAuthMutations hook
vi.mock('../../../hooks/useAuthMutations', () => ({
    useAuthMutations: () => ({
        loginMutation: mockLoginMutation
    })
}));

// Mock the Google OAuth components
vi.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess, onError, text }) => {
        // Create different test scenarios based on data-testid
        const handleClick = (e) => {
            const testId = e.currentTarget.getAttribute('data-testid');

            if (testId === 'google-login-no-credential') {
                // Simulate response without credential
                onSuccess({ credential: null });
            } else if (testId === 'google-login-error') {
                // Simulate error
                onError();
            } else {
                // Default success case
                onSuccess({ credential: 'mock-credential' });
            }
        };

        return (
            <>
                <button onClick={handleClick} data-testid="google-login">
                    {text === 'signin_with' ? 'Sign in with Google' : 'Google Login'}
                </button>
                <button onClick={handleClick} data-testid="google-login-no-credential" style={{ display: 'none' }}>
                    Trigger No Credential
                </button>
                <button onClick={handleClick} data-testid="google-login-error" style={{ display: 'none' }}>
                    Trigger Error
                </button>
            </>
        );
    },
    useGoogleOneTapLogin: () => null
}));

describe('LoginView', () => {
    const mockSetAuthData = vi.fn();
    const mockSetOfflineMode = vi.fn();
    let user;
    let resolveMockLoginMutation;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();

        const loginPromise = new Promise((resolve) => {
            resolveMockLoginMutation = resolve;
        });
        mockLoginMutation.mockReturnValue(loginPromise);
    });

    const renderWithProviders = (options = {}) => {
        const { themeMode = 'light' } = options;

        const theme = createTheme({
            palette: {
                mode: themeMode
            }
        });

        const mockAuthValue = createMockAuthContextValue({
            setAuthData: mockSetAuthData,
            setOfflineMode: mockSetOfflineMode,
            isAuthenticated: false
        });

        return render(
            <ThemeProvider theme={theme}>
                <AuthContext.Provider value={mockAuthValue}>
                    <LoginView />
                </AuthContext.Provider>
            </ThemeProvider>
        );
    };

    describe('Initial rendering', () => {
        it.each([['light'], ['dark']])('renders all required elements in %s mode', (themeMode) => {
            renderWithProviders({ themeMode });

            expect(screen.getByText('Life Event Logger')).toBeInTheDocument();
            expect(screen.getByText('Track and organize the important moments in your life')).toBeInTheDocument();
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();
            expect(screen.getByText(/Explore the app locally/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /try offline mode/i })).toBeInTheDocument();
        });
    });

    describe('Google login', () => {
        it('shows loading state and calls setAuthData on success', async () => {
            renderWithProviders();

            expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state immediately after click
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            // Login form should be hidden
            expect(screen.queryByText('Sign in to get started')).not.toBeInTheDocument();

            // Should call loginMutation with the credential
            expect(mockLoginMutation).toHaveBeenCalledWith({
                variables: {
                    input: {
                        googleToken: 'mock-credential',
                        clientType: 'WEB'
                    }
                }
            });

            // Now resolve the promise to complete the login
            await act(async () => {
                resolveMockLoginMutation({
                    data: {
                        googleOAuthLoginMutation: {
                            accessToken: 'mock-access-token',
                            user: {
                                id: 'user-1',
                                email: 'test@example.com',
                                name: 'Test User'
                            }
                        }
                    }
                });
            });

            expect(mockSetAuthData).toHaveBeenCalledWith('mock-access-token', {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User'
            });
        });

        it('handles login failure with errors', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state initially
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();

            // Should call loginMutation with the credential
            expect(mockLoginMutation).toHaveBeenCalledWith({
                variables: {
                    input: {
                        googleToken: 'mock-credential',
                        clientType: 'WEB'
                    }
                }
            });

            // Now resolve the promise with an error response
            await act(async () => {
                resolveMockLoginMutation({
                    data: {
                        googleOAuthLoginMutation: {
                            accessToken: null,
                            user: null,
                            errors: [{ message: 'Invalid token' }]
                        }
                    }
                });
            });

            // Should show error message
            expect(screen.getByText('Failed to sign in. Please try again.')).toBeInTheDocument();

            // Should return to normal state
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call setAuthData
            expect(mockSetAuthData).not.toHaveBeenCalled();

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', 'Invalid token');

            consoleErrorSpy.mockRestore();
        });

        it('handles login mutation exception', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Create a promise that will reject
            let rejectMockLoginMutation;
            const rejectedLoginPromise = new Promise((_, reject) => {
                rejectMockLoginMutation = reject;
            });
            mockLoginMutation.mockReturnValue(rejectedLoginPromise);

            renderWithProviders();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state initially
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();

            // Now reject the promise with an error
            await act(async () => {
                rejectMockLoginMutation(new Error('Network error'));
                // Need to catch the rejection to prevent unhandled promise rejection
                await rejectedLoginPromise.catch(() => {});
            });

            // Should show error message
            expect(screen.getByText('Failed to sign in. Please try again.')).toBeInTheDocument();

            // Should return to normal state
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call setAuthData
            expect(mockSetAuthData).not.toHaveBeenCalled();

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it('handles login success but no access token returned', async () => {
            renderWithProviders();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state initially
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();

            // Now resolve the promise with no access token
            await act(async () => {
                resolveMockLoginMutation({
                    data: {
                        googleOAuthLoginMutation: {
                            accessToken: null,
                            user: null,
                            errors: []
                        }
                    }
                });
            });

            // Should show error message
            expect(screen.getByText('Failed to sign in. Please try again.')).toBeInTheDocument();

            // Should return to normal state
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call setAuthData
            expect(mockSetAuthData).not.toHaveBeenCalled();
        });

        it('handles missing credentials from Google', async () => {
            renderWithProviders();

            const googleLoginNoCredButton = screen.getByTestId('google-login-no-credential');
            user.click(googleLoginNoCredButton);

            // Should show error message
            expect(await screen.findByText('No credentials received from Google')).toBeInTheDocument();

            // Should remain on login screen
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call loginMutation
            expect(mockLoginMutation).not.toHaveBeenCalled();
        });

        it('handles Google login onError callback', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders();

            const googleLoginErrorButton = screen.getByTestId('google-login-error');
            await user.click(googleLoginErrorButton);

            // Should not show loading state since error is immediate
            expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();

            // Should remain on login screen
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call loginMutation
            expect(mockLoginMutation).not.toHaveBeenCalled();

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith('Google login failed');

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Offline mode', () => {
        it('calls setOfflineMode when offline button is clicked', async () => {
            renderWithProviders();

            const offlineButton = screen.getByRole('button', { name: /try offline mode/i });
            user.click(offlineButton);

            // Wait for MUI animations to complete
            await waitFor(() => {
                expect(mockSetOfflineMode).toHaveBeenCalledWith(true);
            });
        });
    });
});
