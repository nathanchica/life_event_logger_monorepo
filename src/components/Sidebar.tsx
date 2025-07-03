import { useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import blueGrey from '@mui/material/colors/blueGrey';
import green from '@mui/material/colors/green';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import EditIcon from '@mui/icons-material/Edit';
import GitHubIcon from '@mui/icons-material/GitHub';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import ClickAwayListener from '@mui/material/ClickAwayListener';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext, AppTheme } from '../providers/ComponentDisplayProvider';
import EventLabelList from './EventLabels/EventLabelList';

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
    const [isEditingLabels, setIsEditingLabels] = useState(false);
    const { theme, enableDarkTheme, enableLightTheme } = useComponentDisplayContext();

    const isDark = theme === AppTheme.Dark;
    const handleToggleTheme = () => (isDark ? enableLightTheme() : enableDarkTheme());

    const handleClickAway = () => {
        if (isEditingLabels) setIsEditingLabels(false);
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
                            <Typography noWrap variant="h5" gutterBottom>
                                Event Log {isOfflineMode && '(Offline mode)'}
                            </Typography>

                            <Box
                                sx={{ mt: 4 }}
                                css={css`
                                    max-height: 80vh;
                                    overflow-y: auto;
                                `}
                            >
                                <EventLabelList isEditing={isEditingLabels} />
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
                        <Tooltip title="Manage labels">
                            <IconButton
                                onClick={() => setIsEditingLabels((prev) => !prev)}
                                sx={{ ml: 1 }}
                                aria-label="Manage labels"
                            >
                                <EditIcon />
                            </IconButton>
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
                    </Box>
                </Paper>
            </Collapse>
        </ClickAwayListener>
    );
};

export default Sidebar;
