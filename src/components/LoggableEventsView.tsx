/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { blueGrey, green } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';

import CreateEventCard from './EventCards/CreateEventCard';
import { EventCardSkeleton } from './EventCards/EventCard';
import LoggableEventsList from './LoggableEventsList';
import Sidebar from './Sidebar';

import { useToggle } from '../utils/useToggle';

type Props = {
    isLoading?: boolean;
    offlineMode?: boolean;
    isShowingFetchError?: boolean;
};

/**
 * LoggableEventsView component for displaying the main view of loggable events.
 * It shows a list of loggable events and allows users to create new events.
 * It includes a sidebar for navigation and a loading state while data is being fetched.
 */
const LoggableEventsView = ({ isLoading = false, offlineMode = false, isShowingFetchError = false }: Props) => {
    const theme = useTheme();
    const { value: sidebarIsCollapsed, setTrue: collapseSidebar, setFalse: expandSidebar } = useToggle(false);

    const isDarkMode = theme.palette.mode === 'dark';

    const mainContent = (
        <Grid
            role="main"
            aria-label="Loggable events main content"
            css={css`
                padding: 64px;
                overflow-y: scroll;
            `}
            size="grow"
        >
            <Grid container spacing={5} role="list" aria-label="List of loggable events" aria-live="polite">
                {isShowingFetchError ? (
                    <Grid
                        css={css`
                            text-align: center;
                            padding: 48px;
                        `}
                        size={12}
                    >
                        <Typography variant="h5" gutterBottom>
                            Sorry, something went wrong
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Please try again later
                        </Typography>
                    </Grid>
                ) : isLoading ? (
                    <>
                        <Grid role="listitem">
                            <EventCardSkeleton />
                        </Grid>
                        <Grid role="listitem">
                            <EventCardSkeleton />
                        </Grid>
                        <Grid role="listitem">
                            <EventCardSkeleton />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid role="listitem">
                            <CreateEventCard />
                        </Grid>
                        <LoggableEventsList />
                    </>
                )}
            </Grid>
        </Grid>
    );

    return (
        <Paper
            square
            css={css`
                background-color: ${theme.palette.background.default};
                position: relative;
            `}
        >
            {sidebarIsCollapsed && (
                <Box
                    css={css`
                        position: absolute;
                        left: 8px;
                        top: 16px;
                        // https://mui.com/material-ui/customization/z-index/#main-content
                        z-index: 1500;
                    `}
                >
                    <Tooltip title="Show sidebar">
                        <IconButton
                            onClick={expandSidebar}
                            aria-expanded={!sidebarIsCollapsed}
                            aria-label="Show sidebar"
                            css={css`
                                :hover {
                                    background-color: ${isDarkMode ? blueGrey[600] : green[200]};
                                }
                            `}
                        >
                            <KeyboardDoubleArrowRight />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            <Grid
                container
                wrap="nowrap"
                role="application"
                aria-label="Life event logger application"
                css={css`
                    height: 100vh;
                    width: 100vw;
                `}
            >
                <Grid size="auto">
                    <Sidebar
                        isCollapsed={sidebarIsCollapsed}
                        onCollapseSidebarClick={collapseSidebar}
                        isOfflineMode={offlineMode}
                    />
                </Grid>

                {mainContent}
            </Grid>
        </Paper>
    );
};

export default LoggableEventsView;
