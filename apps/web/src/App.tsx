import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorBoundary } from 'react-error-boundary';

import ErrorView from './components/ErrorView';
import EventLoggerPage from './components/EventLoggerPage';
import AuthProvider from './providers/AuthProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides all context providers.
 * Apollo Client is now initialized within EventLoggerPage after auth state is determined.
 */
const App = () => {
    const handleError = (error: Error, errorInfo: { componentStack: string }) => {
        console.error('Application error:', error, errorInfo);
    };

    return (
        <ErrorBoundary FallbackComponent={ErrorView} onError={handleError} onReset={() => (window.location.href = '/')}>
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
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
