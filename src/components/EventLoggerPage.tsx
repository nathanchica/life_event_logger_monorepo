import { useMemo } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoggableEventsGQL from './LoggableEventsGQL';
import LoggableEventsView from './LoggableEventsView';
import LoginView from './LoginView';

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

    const appTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode
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

    let content = <LoginView />;
    if (isOfflineMode) {
        content = <LoggableEventsView offlineMode />;
    } else if (isAuthenticated) {
        content = <LoggableEventsGQL />;
    }

    return <ThemeProvider theme={appTheme}>{content}</ThemeProvider>;
};

export default EventLoggerPage;
