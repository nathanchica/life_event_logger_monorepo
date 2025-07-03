import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import ComponentDisplayProvider from './providers/ComponentDisplayProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import EventLoggerPage from './components/EventLoggerPage';
import { useAuth } from './providers/AuthProvider';

/**
 * Main application component that initializes the app and provides context providers.
 * It uses the AuthProvider's offline mode state.
 */
const App = () => {
    const { isOfflineMode } = useAuth();

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <ComponentDisplayProvider offlineMode={isOfflineMode}>
                <LoggableEventsProvider offlineMode={isOfflineMode}>
                    <EventLoggerPage />
                </LoggableEventsProvider>
            </ComponentDisplayProvider>
        </LocalizationProvider>
    );
};

export default App;
