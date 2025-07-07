import { useMemo, useState, useEffect } from 'react';

import { ApolloProvider, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { lightGreen } from '@mui/material/colors';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoggableEventsGQL from './LoggableEventsGQL';
import LoginView from './LoginView';

import { createApolloClient } from '../apollo/client';
import { useAuth } from '../providers/AuthProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';

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
    const { isAuthenticated, isOfflineMode } = useAuth();
    const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);

    // Initialize Apollo Client when offline mode is determined
    useEffect(() => {
        createApolloClient(isOfflineMode).then(setApolloClient);
    }, [isOfflineMode]);

    const appTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'light' ? { primary: lightGreen } : {})
                },
                components:
                    mode === 'dark'
                        ? {
                              MuiFormHelperText: {
                                  styleOverrides: {
                                      root: {
                                          '&.Mui-error': {
                                              color: 'orange'
                                          }
                                      }
                                  }
                              },
                              MuiInputLabel: {
                                  styleOverrides: {
                                      root: {
                                          '&.Mui-error': {
                                              color: 'orange'
                                          }
                                      }
                                  }
                              },
                              MuiOutlinedInput: {
                                  styleOverrides: {
                                      notchedOutline: {
                                          // This targets the outline border color for error state
                                          '&.Mui-error': {
                                              borderColor: 'orange'
                                          }
                                      },
                                      root: {
                                          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                              borderColor: 'orange'
                                          }
                                      }
                                  }
                              },
                              MuiInput: {
                                  styleOverrides: {
                                      underline: {
                                          '&.Mui-error:after': {
                                              borderBottomColor: 'orange'
                                          }
                                      }
                                  }
                              }
                          }
                        : {}
            }),
        [mode]
    );

    // Don't render anything while Apollo Client is being initialized
    if (!apolloClient) {
        return null;
    }

    return (
        <ThemeProvider theme={appTheme}>
            <ApolloProvider client={apolloClient}>
                {isAuthenticated ? <LoggableEventsGQL /> : <LoginView />}
            </ApolloProvider>
        </ThemeProvider>
    );
};

export default EventLoggerPage;
