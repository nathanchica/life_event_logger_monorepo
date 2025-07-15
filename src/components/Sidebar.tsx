/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import EditIcon from '@mui/icons-material/Edit';
import EditIconOutlined from '@mui/icons-material/EditOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { blueGrey, green } from '@mui/material/colors';

import EventLabelList from './EventLabels/EventLabelList';

import { useAuth } from '../providers/AuthProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { useToggle } from '../utils/useToggle';

type Props = {
    isCollapsed: boolean;
    onCollapseSidebarClick: () => void;
    isOfflineMode: boolean;
};

/**
 * Sidebar component.
 * It includes a list of event labels, theme toggle button,
 * and a link to the GitHub repository.
 */
const Sidebar = ({ isCollapsed, onCollapseSidebarClick, isOfflineMode }: Props) => {
    const { value: isEditingLabels, setTrue: startEditingLabels, setFalse: stopEditingLabels } = useToggle(false);
    const { logout } = useAuth();
    const { theme, enableDarkTheme, enableLightTheme } = useViewOptions();

    const isDark = theme === 'dark';
    const handleToggleTheme = () => (isDark ? enableLightTheme() : enableDarkTheme());

    const handleClickAway = () => {
        if (isEditingLabels) stopEditingLabels();
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
                        background-color: ${isDark ? blueGrey[900] : green[100]};
                        padding: 16px;
                        width: 400px;
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
                                            background-color: ${isDark ? blueGrey[600] : green[200]};
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
                                    max-height: 80vh;
                                    overflow-y: auto;
                                    width: 350px;
                                `}
                            >
                                <EventLabelList isShowingEditActions={isEditingLabels} />
                            </Box>
                        </Box>
                    </Collapse>

                    <Box
                        sx={{
                            position: 'absolute',
                            left: 8,
                            bottom: 16,
                            display: 'flex',
                            justifyContent: 'flex-start',
                            width: '100%'
                        }}
                    >
                        <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                            <IconButton
                                onClick={handleToggleTheme}
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={isEditingLabels ? 'Stop editing labels' : 'Manage labels'}>
                            <ToggleButton
                                value="edit"
                                selected={isEditingLabels}
                                onChange={() => (isEditingLabels ? stopEditingLabels() : startEditingLabels())}
                                sx={{
                                    ml: 1,
                                    border: 'none',
                                    borderRadius: '50%',
                                    '&:hover': {
                                        border: 'none'
                                    }
                                }}
                                size="small"
                                aria-label={isEditingLabels ? 'Stop editing labels' : 'Manage labels'}
                            >
                                {isEditingLabels ? <EditIcon color="action" /> : <EditIconOutlined />}
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="View on GitHub">
                            <IconButton
                                component="a"
                                href="https://github.com/nathanchica/life_event_logger"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ ml: 1 }}
                                aria-label="View on GitHub"
                            >
                                <GitHubIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Logout">
                            <IconButton onClick={logout} sx={{ ml: 1 }} aria-label="Logout">
                                <LogoutIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
            </Collapse>
        </ClickAwayListener>
    );
};

export default Sidebar;
