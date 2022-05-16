import React from 'react';

import LoggableEventsProvider from './components/LoggableEventsProvider';
import LoggableEventsView from './components/LoggableEventsView';

const App = () => {
    return (
        <LoggableEventsProvider>
            <LoggableEventsView />
        </LoggableEventsProvider>
    );
};

export default App;
