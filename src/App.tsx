import ComponentDisplayProvider from './providers/ComponentDisplayProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import LoggableEventsView from './components/LoggableEventsView';

const App = () => {
    return (
        <ComponentDisplayProvider>
            <LoggableEventsProvider>
                <LoggableEventsView />
            </LoggableEventsProvider>
        </ComponentDisplayProvider>
    );
};

export default App;
