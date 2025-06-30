import { useEffect, useState } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import ComponentDisplayProvider from './providers/ComponentDisplayProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import EventLoggerPage from './components/EventLoggerPage';

/**
 * Main application component that initializes the app and provides context providers.
 * It checks for offline mode based on URL parameters and manages user login state.
 */
const App = () => {
    /**
     * Whether or not the app is in offline mode based on a url parameter. If in offline mode, data will not
     * be fetched or persisted.
     */
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    /**
     * Whether or not the user is logged in. If in offline mode, this will be set to true.
     */
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
        if (hasOfflineInUrlParam) {
            setIsOfflineMode(true);
            setIsLoggedIn(true);
            console.info('Application is in offline mode.');
        }

        // Check if auth token in cookies, if so then set isLoggedIn to true
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <ComponentDisplayProvider offlineMode={isOfflineMode}>
                <LoggableEventsProvider offlineMode={isOfflineMode}>
                    <EventLoggerPage isOfflineMode={isOfflineMode} isLoggedIn={isLoggedIn} />
                </LoggableEventsProvider>
            </ComponentDisplayProvider>
        </LocalizationProvider>
    );
};

export default App;
