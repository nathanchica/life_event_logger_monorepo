import { ErrorInfo } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from 'react-error-boundary';

import EventLoggerPage from './components/EventLoggerPage';
import ErrorView from './components/Views/ErrorView';
import AuthProvider from './providers/AuthProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides all context providers.
 * Apollo Client is now initialized within EventLoggerPage after auth state is determined.
 */
const App = () => {
    const handleError = (error: Error, info: ErrorInfo) => {
        console.error('Application error:', error, info);
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: info.componentStack
                }
            }
        });
    };

    return (
        <ErrorBoundary FallbackComponent={ErrorView} onError={handleError} onReset={() => (window.location.href = '/')}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <AuthProvider>
                        <ViewOptionsProvider>
                            <EventLoggerPage />
                        </ViewOptionsProvider>
                    </AuthProvider>
                </LocalizationProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    );
};

export default App;
