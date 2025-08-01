import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockAuthContextValue } from '../../mocks/providers';
import { AuthContext } from '../../providers/AuthProvider';
import LoginView from '../LoginView';

// Mock the Google OAuth components
jest.mock('@react-oauth/google', () => ({
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
    const mockLogin = jest.fn();
    const mockSetOfflineMode = jest.fn();
    let user;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
    });

    const renderWithProviders = (options = {}) => {
        const { themeMode = 'light' } = options;

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
        it('shows loading state and calls login on success', async () => {
            mockLogin.mockResolvedValue(true);
            renderWithProviders();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            // Login form should be hidden
            expect(screen.queryByText('Sign in to get started')).not.toBeInTheDocument();

            // Should call login with the credential
            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('mock-credential');
            });
        });

        it('handles login failure', async () => {
            mockLogin.mockResolvedValue(false);
            renderWithProviders();

            const googleLoginButton = screen.getByTestId('google-login');
            user.click(googleLoginButton);

            // Should show loading state initially
            expect(await screen.findByText('Signing you in...')).toBeInTheDocument();

            // Should call login with the credential
            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('mock-credential');
            });

            // Should show error message
            expect(await screen.findByText('Failed to sign in. Please try again.')).toBeInTheDocument();

            // Should return to normal state
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();
        });

        it('handles missing credentials from Google', async () => {
            renderWithProviders();

            const googleLoginNoCredButton = screen.getByTestId('google-login-no-credential');
            await user.click(googleLoginNoCredButton);

            // Should show error message
            expect(screen.getByText('No credentials received from Google')).toBeInTheDocument();

            // Should remain on login screen
            expect(screen.getByText('Sign in to get started')).toBeInTheDocument();

            // Should not call login
            expect(mockLogin).not.toHaveBeenCalled();
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
