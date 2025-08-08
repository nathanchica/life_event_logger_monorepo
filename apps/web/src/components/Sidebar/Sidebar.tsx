/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
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
import { useAuth } from '../../providers/AuthProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { useToggle } from '../../utils/useToggle';
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
            <Collapse
                in={!isCollapsed}
                collapsedSize={56}
                orientation="horizontal"
                css={css`
                    height: 100%;
                `}
            >
                <Paper
                    elevation={3}
                    square
                    css={css`
                        background-color: ${isDarkMode ? blueGrey[900] : green[100]};
                        padding: 16px;
                        padding-bottom: 80px;
                        width: ${isMobile ? '100vw' : '400px'};
                        height: 100%;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    `}
                >
                    <Collapse in={!isCollapsed} orientation="horizontal">
                        <Box
                            css={css`
                                position: absolute;
                                right: 16px;
                            `}
                        >
                            <Tooltip title="Hide sidebar">
                                <IconButton
                                    onClick={onCollapseSidebarClick}
                                    aria-label="Hide sidebar"
                                    css={css`
                                        :hover {
                                            background-color: ${isDarkMode ? blueGrey[600] : green[200]};
                                        }
                                    `}
                                >
                                    <KeyboardDoubleArrowLeftIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Box
                            css={css`
                                flex: 1 1 auto;
                                overflow-y: auto;
                                min-height: 0;
                            `}
                        >
                            <Box sx={{ ml: 1.5, mt: 1 }}>
                                <Typography noWrap variant="h5">
                                    Event Log {isOfflineMode && '(Offline mode)'}
                                </Typography>
                            </Box>

                            <Box
                                sx={{ mt: 4 }}
                                css={css`
                                    overflow-y: auto;
                                    width: ${isMobile ? '250px' : '350px'};
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <EventLabelShimmer />
                                        <EventLabelShimmer />
                                        <EventLabelShimmer />
                                    </>
                                ) : (
                                    <>
                                        <EventLabelList isShowingEditActions={isEditingLabels} />
                                        {isMobile && (
                                            <SidebarActions
                                                variant="list"
                                                isEditingLabels={isEditingLabels}
                                                onToggleTheme={handleToggleTheme}
                                                onToggleEditLabels={() =>
                                                    isEditingLabels ? stopEditingLabels() : startEditingLabels()
                                                }
                                                onLogout={handleLogout}
                                            />
                                        )}
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Collapse>

                    {!isMobile && (
                        <SidebarActions
                            variant="toolbar"
                            isCollapsed={isCollapsed}
                            isEditingLabels={isEditingLabels}
                            onToggleTheme={handleToggleTheme}
                            onToggleEditLabels={() => (isEditingLabels ? stopEditingLabels() : startEditingLabels())}
                            onLogout={handleLogout}
                        />
                    )}
                </Paper>
            </Collapse>
        </ClickAwayListener>
    );
};

export default Sidebar;
