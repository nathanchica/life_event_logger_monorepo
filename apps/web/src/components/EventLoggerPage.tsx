import { useMemo, useState, useEffect } from 'react';

import { ApolloProvider, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { Snackbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import LoggableEventsGQL from './LoggableEvents/LoggableEventsGQL';
import LoginView from './Views/LoginView';

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
    const { theme: mode, snackbarMessage, snackbarDuration, hideSnackbar } = useViewOptions();
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
            <ApolloProvider client={apolloClient}>
                {user ? <LoggableEventsGQL /> : <LoginView />}
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    slotProps={{
                        clickAwayListener: {
                            /* v8 ignore start */
                            onClickAway: (event) => {
                                // https://mui.com/material-ui/react-snackbar/#preventing-default-click-away-event
                                // @ts-expect-error - defaultMuiPrevented works but isn't in the type definitions
                                event.defaultMuiPrevented = true;
                            }
                            /* v8 ignore end */
                        }
                    }}
                    open={Boolean(snackbarMessage)}
                    message={snackbarMessage}
                    autoHideDuration={snackbarDuration}
                    onClose={hideSnackbar}
                />
            </ApolloProvider>
        </ThemeProvider>
    );
};

export default EventLoggerPage;
