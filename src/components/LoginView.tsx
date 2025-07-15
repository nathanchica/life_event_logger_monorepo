/** @jsxImportSource @emotion/react */

import { useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import { css } from '@emotion/react';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SecurityIcon from '@mui/icons-material/Security';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from '@react-oauth/google';

import { useAuth } from '../providers/AuthProvider';

// Types for mutation inputs
export interface LoginInput {
    googleToken: string;
}

export const LOGIN_MUTATION = gql`
    mutation Login($input: LoginInput!) {
        login(input: $input) {
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
                    input: {
                        googleToken: credentialResponse.credential
                    }
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
        <Box
            css={css`
                height: 100vh;
                width: 100vw;
                background: linear-gradient(
                    135deg,
                    ${theme.palette.mode === 'dark'
                        ? `${theme.palette.secondary.dark}`
                        : `${theme.palette.secondary.light}`},
                    ${theme.palette.background.default}
                );
                display: flex;
                align-items: center;
                justify-content: center;
            `}
        >
            <Container maxWidth="sm">
                <Card
                    elevation={8}
                    css={css`
                        background: ${theme.palette.background.paper};
                        border-radius: 16px;
                        overflow: visible;
                    `}
                >
                    <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                            {/* App Icon and Title */}
                            <Box textAlign="center">
                                <EventNoteIcon
                                    sx={{
                                        fontSize: 64,
                                        color: 'secondary.main',
                                        mb: 2
                                    }}
                                />
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    fontWeight={600}
                                    color="secondary.main"
                                    gutterBottom
                                >
                                    Life Event Logger
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                                    Track and organize the important moments in your life
                                </Typography>
                            </Box>

                            {isLoading ? (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    sx={{
                                        py: 3,
                                        px: 4,
                                        bgcolor: 'action.hover',
                                        borderRadius: 2,
                                        minWidth: 200
                                    }}
                                >
                                    <CircularProgress size={24} />
                                    <Typography variant="body1" fontWeight={500}>
                                        Signing you in...
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%', maxWidth: 400 }}>
                                    <Stack spacing={3} alignItems="center">
                                        {/* Google Sign In Section */}
                                        <Box textAlign="center" sx={{ width: '100%' }}>
                                            <Typography
                                                variant="body1"
                                                fontWeight={500}
                                                gutterBottom
                                                color="text.primary"
                                                sx={{ mb: 3 }}
                                            >
                                                Sign in to get started
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    '& > div': {
                                                        transform: 'scale(1.1)'
                                                    }
                                                }}
                                            >
                                                <GoogleLogin
                                                    onSuccess={handleGoogleLoginSuccess}
                                                    onError={handleGoogleLoginError}
                                                    text="signin_with"
                                                    shape="rectangular"
                                                    theme="outline"
                                                    size="large"
                                                />
                                            </Box>
                                        </Box>

                                        {/* Divider */}
                                        <Divider sx={{ width: '100%', position: 'relative' }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    bgcolor: 'background.paper',
                                                    px: 2,
                                                    fontWeight: 500
                                                }}
                                            >
                                                OR
                                            </Typography>
                                        </Divider>

                                        {/* Offline Mode Section */}
                                        <Box textAlign="center" sx={{ width: '100%' }}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleOfflineMode}
                                                color="secondary"
                                                size="large"
                                                startIcon={<SecurityIcon />}
                                                sx={{
                                                    py: 1.5,
                                                    px: 3,
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    fontSize: '1rem',
                                                    minWidth: 280
                                                }}
                                            >
                                                Try Offline Mode
                                            </Button>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 1.5,
                                                    display: 'block',
                                                    lineHeight: 1.4
                                                }}
                                            >
                                                Explore the app locally without creating an account.
                                                <br />
                                                Changes won&apos;t be permanently saved while in offline mode.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default LoginView;
