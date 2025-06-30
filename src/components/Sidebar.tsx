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

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import LoggableEventList from './LoggableEventList';

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
                                        background-color: ${teal[100]};
                                    }
                                `}
                            >
                                <KeyboardDoubleArrowLeftIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box>
                        <Typography noWrap variant="h6" gutterBottom>
                            Event Log {isOfflineMode && '(Offline mode)'}
                        </Typography>

                        <LoggableEventList />
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
                </Box>
            </Paper>
        </Collapse>
    );
};

export default Sidebar;
