import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import blueGrey from '@mui/material/colors/blueGrey';
import teal from '@mui/material/colors/teal';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import { useComponentDisplayContext, AppTheme } from '../providers/ComponentDisplayProvider';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EventLabelList from './EventLabels/EventLabelList';

type Props = {
    isCollapsed: boolean;
    onCollapseSidebarClick: () => void;
    isOfflineMode: boolean;
};

const Sidebar = ({ isCollapsed, onCollapseSidebarClick, isOfflineMode }: Props) => {
    const { theme, enableDarkTheme, enableLightTheme } = useComponentDisplayContext();
    const isDark = theme === AppTheme.Dark;
    const handleToggleTheme = () => (isDark ? enableLightTheme() : enableDarkTheme());

    return (
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
                    background-color: ${isDark ? blueGrey[900] : teal[50]};
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
                                css={css`
                                    :hover {
                                        background-color: ${isDark ? blueGrey[600] : teal[100]};
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
                            <EventLabelList />
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
                        <IconButton onClick={handleToggleTheme} color="inherit">
                            {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="View on GitHub">
                        <IconButton
                            color="inherit"
                            component="a"
                            href="https://github.com/nathanchica/life_event_logger"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ ml: 1 }}
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>
        </Collapse>
    );
};

export default Sidebar;
