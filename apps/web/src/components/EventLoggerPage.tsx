import { useMemo, useState, useEffect } from 'react';

import { ApolloProvider, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ThemeProvider } from '@mui/material/styles';

import LoggableEventsGQL from './LoggableEventsGQL';
import LoginView from './LoginView';

import { createApolloClient } from '../apollo/client';
import { useAuth } from '../providers/AuthProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { createAppTheme } from '../utils/theme';

/**
 * Event Logger Page
 *
 * This component serves as the main entry point for the event logger application, managing which view to display
 * based on the user's login status and whether the application is in offline mode.
 *
 * It uses Material-UI's ThemeProvider to apply a theme based on the current mode (light or dark).
 * The theme includes custom styles for error states in form components when in dark mode.
 */
const EventLoggerPage = () => {
    const { theme: mode } = useViewOptions();
    const { user, isOfflineMode, isInitializing } = useAuth();
    const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);

    // Initialize Apollo Client
    useEffect(() => {
        createApolloClient(isOfflineMode).then(setApolloClient);
    }, [isOfflineMode]);

    const appTheme = useMemo(() => createAppTheme(mode), [mode]);

    // Don't render anything while Apollo Client is being initialized or auth is initializing
    if (!apolloClient || isInitializing) {
        return null;
    }

    return (
        <ThemeProvider theme={appTheme}>
            <ApolloProvider client={apolloClient}>{user ? <LoggableEventsGQL /> : <LoginView />}</ApolloProvider>
        </ThemeProvider>
    );
};

export default EventLoggerPage;
