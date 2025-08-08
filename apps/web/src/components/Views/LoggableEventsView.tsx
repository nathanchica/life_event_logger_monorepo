/** @jsxImportSource @emotion/react */

import { useEffect, useState } from 'react';

import { css } from '@emotion/react';
import KeyboardDoubleArrowRight from '@mui/icons-material/KeyboardDoubleArrowRight';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { blueGrey, green } from '@mui/material/colors';

import useMuiState from '../../hooks/useMuiState';
import { useToggle } from '../../utils/useToggle';
import CreateEventCard from '../EventCards/CreateEventCard';
import EventCardShimmer from '../EventCards/EventCardShimmer';
import LoggableEventsList from '../LoggableEvents/LoggableEventsList';
import Sidebar from '../Sidebar/Sidebar';

type Props = {
    isLoading?: boolean;
    isShowingFetchError?: boolean;
};

/**
 * LoggableEventsView component for displaying the main view of loggable events.
 * It shows a list of loggable events and allows users to create new events.
 * It includes a sidebar for navigation and a loading state while data is being fetched.
 */
const LoggableEventsView = ({ isLoading = false, isShowingFetchError = false }: Props) => {
    const { theme, isMobile, isDarkMode } = useMuiState();
    const { value: sidebarIsCollapsed, setTrue: collapseSidebar, setFalse: expandSidebar } = useToggle(isMobile);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isMobile) {
            collapseSidebar();
        } else {
            expandSidebar();
        }
    }, [isMobile, collapseSidebar, expandSidebar]);

    const mainContent = (
        <Grid
            role="main"
            aria-label="Loggable events main content"
            sx={{
                overflowY: 'auto',
                padding: isMobile ? 4 : 6,
                minHeight: '100vh'
            }}
            size="grow"
        >
            {!isLoading && !isShowingFetchError && (
                <Box sx={{ mb: isMobile ? 4 : 8, maxWidth: 800, mx: 'auto' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            boxShadow: isDarkMode ? 'none' : 1
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }
                        }}
                        aria-label="Search events"
                    />
                </Box>
            )}
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
                        <EventCardShimmer />
                        <EventCardShimmer />
                        <EventCardShimmer />
                    </>
                ) : (
                    <>
                        <CreateEventCard />
                        <LoggableEventsList searchTerm={searchTerm} />
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
                width: 100%;
                ${isMobile && !sidebarIsCollapsed
                    ? `
                    height: 100vh;
                    height: 100dvh;
                    overflow: hidden;
                `
                    : ''}
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
                    width: 100%;
                    align-items: flex-start;
                `}
            >
                <Grid
                    size="auto"
                    css={css`
                        position: ${isMobile && !sidebarIsCollapsed ? 'fixed' : 'sticky'};
                        top: 0;
                        left: 0;
                        height: 100vh;
                        height: 100dvh;
                        z-index: ${isMobile && !sidebarIsCollapsed ? theme.zIndex.drawer : 'auto'};
                    `}
                >
                    <Sidebar
                        isCollapsed={sidebarIsCollapsed}
                        isLoading={isLoading}
                        onCollapseSidebarClick={collapseSidebar}
                    />
                </Grid>

                {mainContent}
            </Grid>
        </Paper>
    );
};

export default LoggableEventsView;
