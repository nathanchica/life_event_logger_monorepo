/** @jsxImportSource @emotion/react */

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { blueGrey, green } from '@mui/material/colors';

import SidebarActions from './SidebarActions';

import { useAuthMutations } from '../../hooks/useAuthMutations';
import useMuiState from '../../hooks/useMuiState';
import { useToggle } from '../../hooks/useToggle';
import { useAuth } from '../../providers/AuthProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { fullViewportHeight } from '../../utils/theme';
import EventLabelList from '../EventLabels/EventLabelList';
import EventLabelShimmer from '../EventLabels/EventLabelShimmer';

type Props = {
    isCollapsed: boolean;
    isLoading: boolean;
    onCollapseSidebarClick: () => void;
};

/**
 * Sidebar component.
 * It includes a list of event labels, theme toggle button,
 * and a link to the GitHub repository.
 */
const Sidebar = ({ isCollapsed, isLoading, onCollapseSidebarClick }: Props) => {
    const { isMobile, isDarkMode } = useMuiState();
    const { value: isEditingLabels, setTrue: startEditingLabels, setFalse: stopEditingLabels } = useToggle(false);
    const { clearAuthData, isOfflineMode } = useAuth();
    const { logoutMutation } = useAuthMutations();
    const { enableDarkTheme, enableLightTheme } = useViewOptions();

    const handleLogout = async () => {
        if (!isOfflineMode) {
            try {
                await logoutMutation();
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        clearAuthData();
    };

    const handleToggleTheme = () => (isDarkMode ? enableLightTheme() : enableDarkTheme());

    const handleClickAway = () => {
        stopEditingLabels();
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <Collapse in={!isCollapsed} collapsedSize={56} orientation="horizontal" css={fullViewportHeight}>
                <Paper
                    elevation={3}
                    square
                    css={fullViewportHeight}
                    sx={{
                        backgroundColor: isDarkMode ? blueGrey[900] : green[100],
                        p: 2,
                        width: isMobile ? '100vw' : '400px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Collapse in={!isCollapsed} orientation="horizontal" sx={{ height: '100%' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                width: '100%',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    ml: 1.5,
                                    mt: 1,
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Typography noWrap variant="h5">
                                    Event Log {isOfflineMode && '(Offline mode)'}
                                </Typography>

                                <Tooltip title="Hide sidebar">
                                    <IconButton
                                        onClick={onCollapseSidebarClick}
                                        aria-label="Hide sidebar"
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: isDarkMode ? blueGrey[600] : green[200]
                                            }
                                        }}
                                    >
                                        <KeyboardDoubleArrowLeftIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box
                                sx={{
                                    flex: '1 1 auto',
                                    overflowY: 'scroll',
                                    overflowX: 'hidden',
                                    minHeight: 0,
                                    width: isMobile ? '90vw' : '350px'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <EventLabelShimmer />
                                        <EventLabelShimmer />
                                        <EventLabelShimmer />
                                    </>
                                ) : (
                                    <EventLabelList isShowingEditActions={isEditingLabels} />
                                )}
                            </Box>

                            <Box
                                sx={{
                                    pt: 2,
                                    ...(isMobile ? { flexShrink: 0 } : { mt: 'auto' })
                                }}
                            >
                                <SidebarActions
                                    variant={isMobile ? 'list' : 'toolbar'}
                                    isEditingLabels={isEditingLabels}
                                    onToggleTheme={handleToggleTheme}
                                    onToggleEditLabels={() =>
                                        isEditingLabels ? stopEditingLabels() : startEditingLabels()
                                    }
                                    onLogout={handleLogout}
                                />
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>
            </Collapse>
        </ClickAwayListener>
    );
};

export default Sidebar;
