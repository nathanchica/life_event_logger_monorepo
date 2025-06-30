import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import teal from '@mui/material/colors/teal';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useTheme } from '@mui/material/styles';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import CreateEventCard from './EventCards/CreateEventCard';
import { EventCardSkeleton } from './EventCards/EventCard';
import LoggableEventCard from './EventCards/LoggableEventCard';
import Sidebar from './Sidebar';

type Props = {
    offlineMode: boolean;
};

const LoggableEventsView = ({ offlineMode }: Props) => {
    const { loadingStateIsShowing } = useComponentDisplayContext();
    const { loggableEvents } = useLoggableEventsContext();
    const theme = useTheme();

    const [sidebarIsCollapsed, setSidebarIsCollapsed] = useState(false);
    const expandSidebar = () => setSidebarIsCollapsed(false);
    const collapseSidebar = () => setSidebarIsCollapsed(true);

    const mainContent = (
        <Grid
            item
            xs={12}
            css={css`
                padding: 64px;
            `}
        >
            <Grid container spacing={5}>
                {loadingStateIsShowing ? (
                    <>
                        <Grid item>
                            <EventCardSkeleton />
                        </Grid>
                        <Grid item>
                            <EventCardSkeleton />
                        </Grid>
                        <Grid item>
                            <EventCardSkeleton />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item>
                            <CreateEventCard />
                        </Grid>
                        {loggableEvents
                            .filter(({ active }) => active)
                            .map(({ id, name }) => {
                                return (
                                    <Grid item key={`${name}-card`}>
                                        <LoggableEventCard eventId={id} />
                                    </Grid>
                                );
                            })}
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
                            css={css`
                                :hover {
                                    background-color: ${teal[200]};
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
