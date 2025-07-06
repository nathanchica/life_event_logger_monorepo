/** @jsxImportSource @emotion/react */

import { useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import { css } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from '@react-oauth/google';

import { useAuth } from '../providers/AuthProvider';

export const LOGIN_MUTATION = gql`
    mutation Login($googleToken: String!) {
        login(googleToken: $googleToken) {
            token
            user {
                id
                email
                name
            }
        }
    }
`;

/**
 * LoginView component
 * This component handles user login using Google One Tap.
 * It displays a welcome message, a loading indicator during login,
 * and options to sign in with Google or continue in offline mode.
 */
const LoginView = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loginMutation] = useMutation(LOGIN_MUTATION);
    const { login, setOfflineMode } = useAuth();
    const theme = useTheme();

    const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
        setIsLoading(true);
        try {
            const { data } = await loginMutation({
                variables: {
                    googleToken: credentialResponse.credential
                }
            });

            if (data?.login?.token) {
                login(data.login.token, data.login.user);
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLoginError = () => {
        console.error('Google login failed');
        setIsLoading(false);
    };

    const handleOfflineMode = () => {
        setOfflineMode(true);
    };

    // Enable Google One Tap login
    useGoogleOneTapLogin({
        onSuccess: handleGoogleLoginSuccess,
        onError: handleGoogleLoginError,
        disabled: isLoading
    });

    return (
        <Paper
            square
            css={css`
                height: 100vh;
                width: 100vw;
                background-color: ${theme.palette.background.default};
                position: relative;
            `}
        >
            <Box
                css={css`
                    margin: auto;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                `}
            >
                <Typography variant="h5" component="h1" textAlign="center">
                    Welcome to Life Event Logger
                </Typography>

                {isLoading ? (
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={20} />
                        <Typography>Logging in...</Typography>
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <Typography variant="body2" textAlign="center" color="textSecondary">
                            Sign in with your Google account to get started
                        </Typography>
                        <GoogleLogin
                            onSuccess={handleGoogleLoginSuccess}
                            onError={handleGoogleLoginError}
                            text="signin_with"
                        />
                        <Typography variant="body2" textAlign="center" color="textSecondary" sx={{ mt: 2 }}>
                            or
                        </Typography>
                        <Button variant="text" onClick={handleOfflineMode} size="small">
                            Continue without signing in (Offline mode)
                        </Button>
                        <Typography variant="caption" textAlign="center" color="textSecondary" sx={{ maxWidth: 400 }}>
                            Offline mode lets you explore the app without saving data
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default LoginView;
