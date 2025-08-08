/** @jsxImportSource @emotion/react */

import { useEffect, useState } from 'react';

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
import { useToggle } from '../../hooks/useToggle';
import { fullViewportHeight } from '../../utils/theme';
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

    const isMobileSidebarOpen = isMobile && !sidebarIsCollapsed;

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
                height: '100%',
                flex: 1
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
                        sx={{
                            textAlign: 'center',
                            p: 6
                        }}
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
            css={fullViewportHeight}
            sx={{
                backgroundColor: theme.palette.background.default,
                position: 'relative',
                width: '100%',
                overflow: 'hidden'
            }}
        >
            {sidebarIsCollapsed && (
                <Box
                    sx={{
                        position: 'fixed',
                        left: 8,
                        top: 8,
                        zIndex: theme.zIndex.drawer
                    }}
                >
                    <Tooltip title="Show sidebar">
                        <IconButton
                            onClick={expandSidebar}
                            aria-expanded={!sidebarIsCollapsed}
                            aria-label="Show sidebar"
                            sx={{
                                '&:hover': {
                                    backgroundColor: isDarkMode ? blueGrey[600] : green[200]
                                }
                            }}
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
                sx={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'flex-start'
                }}
            >
                <Grid
                    size="auto"
                    css={fullViewportHeight}
                    sx={{
                        position: isMobileSidebarOpen ? 'fixed' : 'relative',
                        top: 0,
                        left: 0,
                        zIndex: isMobileSidebarOpen ? theme.zIndex.drawer : 'auto',
                        flexShrink: 0
                    }}
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
