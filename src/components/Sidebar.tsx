import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import teal from '@mui/material/colors/teal';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import LoggableEventList from './LoggableEventList';

type Props = {
    isCollapsed: boolean;
    onCollapseSidebarClick: () => void;
    isOfflineMode: boolean;
};

const Sidebar = ({ isCollapsed, onCollapseSidebarClick, isOfflineMode }: Props) => {
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
                css={css`
                    background-color: ${isCollapsed ? teal[100] : teal[50]};
                    padding: 16px;
                    width: 400px;
                    height: 100%;
                    position: relative;
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
            </Paper>
        </Collapse>
    );
};

export default Sidebar;
