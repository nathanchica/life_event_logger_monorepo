import { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoggableEventsView from './LoggableEventsView';
import LoginView from './LoginView';
import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';

type Props = {
    isOfflineMode: boolean;
    isLoggedIn: boolean;
};

/**
 * Event Logger Page
 *
 * This component serves as the main entry point for the event logger application, managing which view to display
 * based on the user's login status and whether the application is in offline mode.
 */
const EventLoggerPage = ({ isOfflineMode, isLoggedIn }: Props) => {
    const { theme: mode } = useComponentDisplayContext();

    const appTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode
                }
            }),
        [mode]
    );

    return (
        <ThemeProvider theme={appTheme}>
            {isLoggedIn ? <LoggableEventsView offlineMode={isOfflineMode} /> : <LoginView />}
        </ThemeProvider>
    );
};

export default EventLoggerPage;
