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
    const theme = createTheme();
    const mockUser = createMockUser();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (mocks = []) => {
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
        it('renders all required elements', () => {
            renderWithProviders();

            expect(screen.getByText('Welcome to Life Event Logger')).toBeInTheDocument();
            expect(screen.getByText('Sign in with your Google account to get started')).toBeInTheDocument();
            expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
            expect(screen.getByText('Offline mode lets you explore the app without saving data')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /continue without signing in/i })).toBeInTheDocument();
        });
    });

    describe('Google login', () => {
        const loginSuccessMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: { googleToken: 'mock-credential' }
            },
            result: {
                data: {
                    login: {
                        token: 'mock-auth-token',
                        user: mockUser
                    }
                }
            }
        };

        const loginErrorMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: { googleToken: 'mock-credential' }
            },
            error: new Error('Login failed')
        };

        const loginNoTokenMock = {
            request: {
                query: LOGIN_MUTATION,
                variables: { googleToken: 'mock-credential' }
            },
            result: {
                data: {
                    login: {
                        token: null,
                        user: null
                    }
                }
            }
        };

        it('shows loading state and calls login on success', async () => {
            renderWithProviders([loginSuccessMock]);

            const googleLoginButton = screen.getByTestId('google-login');
            userEvent.click(googleLoginButton);

            // Should show loading state
            expect(screen.getByText('Logging in...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            // Login form should be hidden
            expect(screen.queryByText('Sign in with your Google account to get started')).not.toBeInTheDocument();

            // Should call login after success
            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('mock-auth-token', mockUser);
            });
        });

        it.each([
            ['handles login errors', loginErrorMock],
            ['handles null token response', loginNoTokenMock]
        ])('on %s - %s', async (_, mock) => {
            renderWithProviders([mock]);

            const googleLoginButton = screen.getByTestId('google-login');
            userEvent.click(googleLoginButton);

            // Should return to normal state
            await waitFor(() => {
                expect(screen.getByText('Sign in with your Google account to get started')).toBeInTheDocument();
            });

            // Should not call login
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('handles Google login onError callback', async () => {
            renderWithProviders();

            const googleLoginErrorButton = screen.getByTestId('google-login-error');
            userEvent.click(googleLoginErrorButton);

            // Should not show loading state since error is immediate
            expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();

            // Should remain on login screen
            expect(screen.getByText('Sign in with your Google account to get started')).toBeInTheDocument();

            // Should not call login
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Offline mode', () => {
        it('calls setOfflineMode when offline button is clicked', async () => {
            renderWithProviders();

            const offlineButton = screen.getByRole('button', { name: /continue without signing in/i });
            userEvent.click(offlineButton);

            expect(mockSetOfflineMode).toHaveBeenCalledWith(true);
        });
    });
});
