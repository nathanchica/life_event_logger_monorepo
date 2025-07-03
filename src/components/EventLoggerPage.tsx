import { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoggableEventsView from './LoggableEventsView';
import LoginView from './LoginView';
import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useAuth } from '../providers/AuthProvider';

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
    const { theme: mode } = useComponentDisplayContext();
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

    return (
        <ThemeProvider theme={appTheme}>
            {isAuthenticated || isOfflineMode ? <LoggableEventsView offlineMode={isOfflineMode} /> : <LoginView />}
        </ThemeProvider>
    );
};

export default EventLoggerPage;
