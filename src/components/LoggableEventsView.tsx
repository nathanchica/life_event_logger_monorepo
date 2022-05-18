import { useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import teal from '@mui/material/colors/teal';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import CreateEventCard from './CreateEventCard';
import { EventCardSkeleton } from './EventCard';
import LoggableEventCard from './LoggableEventCard';
import LoggableEventList from './LoggableEventList';

type Props = {
    offlineMode: boolean;
};

const sidebarToggleButtonCss = css`
    :hover {
        background-color: ${teal[100]};
    }
`;

const LoggableEventsView = ({ offlineMode }: Props) => {
    const { loadingStateIsShowing } = useComponentDisplayContext();
    const { loggableEvents } = useLoggableEventsContext();

    const [sidebarIsShowing, setSidebarIsShowing] = useState(true);
    const showSidebar = () => setSidebarIsShowing(true);
    const hideSidebar = () => setSidebarIsShowing(false);

    const sidebar = (
        <Grid item>
            <Collapse
                in={sidebarIsShowing}
                collapsedSize={56}
                orientation="horizontal"
                css={css`
                    height: 100%;
                `}
            >
                <Paper
                    elevation={3}
                    css={css`
                        background-color: ${teal[50]};
                        padding: 16px;
                        width: 400px;
                        height: 100%;
                        position: relative;
                    `}
                >
                    {sidebarIsShowing && (
                        <>
                            <Box
                                css={css`
                                    position: absolute;
                                    right: 16px;
                                `}
                            >
                                <Tooltip title="Hide sidebar">
                                    <IconButton onClick={hideSidebar} css={sidebarToggleButtonCss}>
                                        <KeyboardDoubleArrowLeftIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Event Log {offlineMode && '(Offline mode)'}
                                </Typography>

                                <LoggableEventList />
                            </Box>
                        </>
                    )}
                </Paper>
            </Collapse>
        </Grid>
    );

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
                            .map(({ name }) => {
                                return (
                                    <Grid item key={`${name}-card`}>
                                        <LoggableEventCard eventName={name} />
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
            css={css`
                background-color: #fafafa;
                position: relative;
            `}
        >
            {!sidebarIsShowing && (
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
                        <IconButton onClick={showSidebar} css={sidebarToggleButtonCss}>
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
                {sidebar}

                {mainContent}
            </Grid>
        </Paper>
    );
};

export default LoggableEventsView;
