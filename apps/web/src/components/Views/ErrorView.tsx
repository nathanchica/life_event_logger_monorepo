import { useMemo } from 'react';

import { ErrorOutline } from '@mui/icons-material';
import { Box, Button, Container, Link, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { FallbackProps } from 'react-error-boundary';

import { createAppTheme } from '../../utils/theme';

/**
 * Error view component that displays a user-friendly error message
 * with an option to retry or reset the application state.
 * Compatible with react-error-boundary's FallbackComponent prop.
 * Includes its own ThemeProvider to respect system theme preferences.
 */
const ErrorView = ({ error, resetErrorBoundary }: FallbackProps) => {
    // Detect OS preference for dark mode
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const theme = useMemo(() => createAppTheme(prefersDarkMode ? 'dark' : 'light'), [prefersDarkMode]);

    const handleClearLocalData = () => {
        try {
            localStorage.removeItem('apollo-cache-persist');
        } finally {
            resetErrorBoundary();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Container maxWidth="sm">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 3
                        }}
                    >
                        <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />

                        <Typography variant="h4" component="h1" gutterBottom>
                            Oops! Something went wrong
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            We&apos;re sorry, but something unexpected happened.
                            <br />
                            <br />
                            Please try again, or if the error persists, try clearing your local data.
                            <br />
                            If that doesn&apos;t work, please contact{' '}
                            <Link href="mailto:chicanathan@gmail.com" underline="hover">
                                chicanathan@gmail.com
                            </Link>
                            .
                        </Typography>

                        {process.env.NODE_ENV === 'development' && (
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100'),
                                    borderRadius: 1,
                                    width: '100%',
                                    maxHeight: 200,
                                    overflow: 'auto',
                                    border: 1,
                                    borderColor: 'divider'
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    component="pre"
                                    sx={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                >
                                    {error.message}
                                    {error.stack && '\n\n' + error.stack}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button variant="contained" color="primary" onClick={resetErrorBoundary}>
                                Try Again
                            </Button>
                            <Button variant="outlined" color="secondary" onClick={handleClearLocalData}>
                                Clear my local data
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default ErrorView;
