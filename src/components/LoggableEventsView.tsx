import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import blueGrey from '@mui/material/colors/blueGrey';
import green from '@mui/material/colors/green';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useTheme } from '@mui/material/styles';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import CreateEventCard from './EventCards/CreateEventCard';
import Sidebar from './Sidebar';
import LoggableEventsList from './LoggableEventsList';

type Props = {
    offlineMode?: boolean;
};

/**
 * LoggableEventsView component for displaying the main view of loggable events.
 * It shows a list of loggable events and allows users to create new events.
 * It includes a sidebar for navigation and a loading state while data is being fetched.
 */
const LoggableEventsView = ({ offlineMode = false }: Props) => {
    const theme = useTheme();

    const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState(false);
    const expandSidebar = () => setSidebarIsCollapsed(false);
    const collapseSidebar = () => setSidebarIsCollapsed(true);

    const isDarkMode = theme.palette.mode === 'dark';

    const mainContent = (
        <Grid
            item
            xs={12}
            role="main"
            aria-label="Loggable events main content"
            css={css`
                padding: 64px;
            `}
        >
            <Grid container spacing={5} role="list" aria-label="List of loggable events" aria-live="polite">
                <Grid item role="listitem">
                    <CreateEventCard />
                </Grid>
                <LoggableEventsList offlineMode={offlineMode} />
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
                <Grid item>
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
