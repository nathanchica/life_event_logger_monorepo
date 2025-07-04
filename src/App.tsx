import AuthProvider from './providers/AuthProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import EventLoggerPage from './components/EventLoggerPage';

/**
 * Main application component that initializes the app and provides context providers.
 * External providers in index.tsx
 */
const App = () => {
    return (
        <AuthProvider>
            <ViewOptionsProvider>
                <LoggableEventsProvider>
                    <EventLoggerPage />
                </LoggableEventsProvider>
            </ViewOptionsProvider>
        </AuthProvider>
    );
};

export default App;
