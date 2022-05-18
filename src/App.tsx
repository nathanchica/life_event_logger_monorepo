import { useEffect, useState } from 'react';

import ComponentDisplayProvider from './providers/ComponentDisplayProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import LoggableEventsView from './components/LoggableEventsView';

const App = () => {
    /**
     * Whether or not the app is in offline mode based on a url parameter. If in offline mode, data will not
     * be fetched or persisted from the server.
     */
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
        if (hasOfflineInUrlParam) {
            setIsOfflineMode(true);
            console.info('Application is in offline mode.');
        }
    }, []);

    return (
        <ComponentDisplayProvider>
            <LoggableEventsProvider offlineMode={isOfflineMode}>
                <LoggableEventsView offlineMode={isOfflineMode} />
            </LoggableEventsProvider>
        </ComponentDisplayProvider>
    );
};

export default App;
