import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';

import EventLoggerPage from './components/EventLoggerPage';
import AuthProvider from './providers/AuthProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides all context providers.
 * Apollo Client is now initialized within EventLoggerPage after auth state is determined.
 */
const App = () => {
    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <AuthProvider>
                    <ViewOptionsProvider>
                        <EventLoggerPage />
                    </ViewOptionsProvider>
                </AuthProvider>
            </LocalizationProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
