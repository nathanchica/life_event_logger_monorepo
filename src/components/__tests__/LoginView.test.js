import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import LoginView, { LOGIN_MUTATION } from '../LoginView';

// Mock the Google OAuth components
jest.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess, onError, text }) => (
        <>
            <button onClick={() => onSuccess({ credential: 'mock-credential' })} data-testid="google-login">
                {text === 'signin_with' ? 'Sign in with Google' : 'Google Login'}
            </button>
            <button onClick={() => onError()} data-testid="google-login-error" style={{ display: 'none' }}>
                Trigger Error
            </button>
        </>
    ),
    useGoogleOneTapLogin: () => null
}));

describe('LoginView', () => {
    const mockLogin = jest.fn();
    const mockSetOfflineMode = jest.fn();
    const mockUser = createMockUser();
    let user;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
    });

    const renderWithProviders = (options = {}) => {
        const { mocks = [], themeMode = 'light' } = options;

        const theme = createTheme({
            palette: {
                mode: themeMode
            }
        });

        const mockAuthValue = createMockAuthContextValue({
            login: mockLogin,
            setOfflineMode: mockSetOfflineMode,
            isAuthenticated: false
        });

        return render(
            <MockedProvider mocks={mocks} addTypename={false}>
                <ThemeProvider theme={theme}>
                    <AuthContext.Provider value={mockAuthValue}>
                        <LoginView />
                    </AuthContext.Provider>
                </ThemeProvider>
            </MockedProvider>
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
        const loginSuccessMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: {
                    input: {
                        googleToken: 'mock-credential'
                    }
                }
            },
            result: {
                data: {
                    googleOAuthLoginMutation: {
                        token: 'mock-auth-token',
                        user: mockUser,
                        errors: []
                    }
                }
            }
        };

        const loginErrorMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: {
                    input: {
                        googleToken: 'mock-credential'
                    }
                }
            },
            error: new Error('Login failed')
        };

        const loginNoTokenMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: {
                    input: {
                        googleToken: 'mock-credential'
                    }
                }
            },
            result: {
                data: {
                    googleOAuthLoginMutation: {
                        token: null,
                        user: null,
                        errors: []
                    }
                }
            }
        };

        it('shows loading state and calls login on success', async () => {
            renderWithProviders({ mocks: [loginSuccessMock] });

            const googleLoginButton = screen.getByTestId('google-login');
            await user.click(googleLoginButton);

            // Should show loading state
            expect(screen.getByText('Signing you in...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            // Login form should be hidden
            expect(screen.queryByText('Sign in to get started')).not.toBeInTheDocument();

            // Should call login after success
            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('mock-auth-token', mockUser);
            });
        });

        it.each([
            ['handles login errors', loginErrorMock],
            ['handles null token response', loginNoTokenMock]
        ])('%s', async (_, mock) => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders({ mocks: [mock] });

            const googleLoginButton = screen.getByTestId('google-login');
            await user.click(googleLoginButton);

            // Should return to normal state
            await waitFor(() => {
                expect(screen.getByText('Sign in to get started')).toBeInTheDocument();
            });

            // Should not call login
            expect(mockLogin).not.toHaveBeenCalled();

            console.error.mockRestore();
        });

        it('handles Google login onError callback', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders();

            const googleLoginErrorButton = screen.getByTestId('google-login-error');
            await user.click(googleLoginErrorButton);

            // Should not show loading state since error is immediate
            expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();

            // Should remain on login screen
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call login
            expect(mockLogin).not.toHaveBeenCalled();

            console.error.mockRestore();
        });
    });

    describe('Offline mode', () => {
        it('calls setOfflineMode when offline button is clicked', async () => {
            renderWithProviders();

            const offlineButton = screen.getByRole('button', { name: /try offline mode/i });
            await user.click(offlineButton);

            expect(mockSetOfflineMode).toHaveBeenCalledWith(true);
        });
    });
});
