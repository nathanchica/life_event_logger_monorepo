import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import EditIcon from '@mui/icons-material/Edit';
import EditIconOutlined from '@mui/icons-material/EditOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';

import useMuiState from '../hooks/useMuiState';

type Props = {
    variant: 'list' | 'toolbar';
    isEditingLabels: boolean;
    onToggleTheme: () => void;
    onToggleEditLabels: () => void;
    onLogout: () => void;
    isCollapsed?: boolean;
};

const SidebarActions = ({
    variant,
    isEditingLabels,
    onToggleTheme,
    onToggleEditLabels,
    onLogout,
    isCollapsed = false
}: Props) => {
    const { isDarkMode } = useMuiState();

    const actions = [
        {
            key: 'theme',
            icon: isDarkMode ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />,
            label: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
            onClick: onToggleTheme,
            isToggle: false,
            selected: false
        },
        {
            key: 'edit',
            icon: isEditingLabels ? (
                <EditIcon color="action" fontSize="small" />
            ) : (
                <EditIconOutlined fontSize="small" />
            ),
            label: isEditingLabels ? 'Stop editing labels' : 'Manage labels',
            onClick: onToggleEditLabels,
            isToggle: true,
            selected: isEditingLabels
        },
        {
            key: 'github',
            icon: <GitHubIcon fontSize="small" />,
            label: 'View on GitHub',
            onClick: () => window.open('https://github.com/nathanchica/life_event_logger_monorepo', '_blank'),
            isToggle: false,
            selected: false,
            isLink: true,
            href: 'https://github.com/nathanchica/life_event_logger_monorepo'
        },
        {
            key: 'logout',
            icon: <LogoutIcon fontSize="small" />,
            label: 'Logout',
            onClick: onLogout,
            isToggle: false,
            selected: false
        }
    ];

    if (variant === 'list') {
        return (
            <List dense disablePadding>
                {actions.map((action) => (
                    <ListItem key={action.key} disablePadding>
                        <ListItemButton
                            onClick={action.onClick}
                            selected={action.selected}
                            sx={{ py: 0.5 }}
                            component={action.isLink ? 'a' : 'div'}
                            href={action.href}
                            target={action.isLink ? '_blank' : undefined}
                            rel={action.isLink ? 'noopener noreferrer' : undefined}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{action.icon}</ListItemIcon>
                            <ListItemText primary={action.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        );
    }

    // toolbar variant
    return (
        <Box
            sx={{
                position: 'absolute',
                left: isCollapsed ? -999 : 8,
                bottom: 16,
                display: 'flex',
                justifyContent: 'flex-start',
                zIndex: 1
            }}
        >
            {actions.map((action, index) => (
                <Tooltip key={action.key} title={action.label}>
                    {action.isToggle ? (
                        <ToggleButton
                            value="edit"
                            selected={action.selected}
                            onChange={action.onClick}
                            sx={{
                                // ignoring coverage here since it's not possible to test with current actions
                                ml: /* istanbul ignore next */ index > 0 ? 1 : 0,
                                border: 'none',
                                borderRadius: '50%',
                                '&:hover': {
                                    border: 'none'
                                }
                            }}
                            size="small"
                            aria-label={action.label}
                        >
                            {action.icon}
                        </ToggleButton>
                    ) : (
                        <IconButton
                            onClick={action.onClick}
                            component={action.isLink ? 'a' : 'button'}
                            href={action.href}
                            target={action.isLink ? '_blank' : undefined}
                            rel={action.isLink ? 'noopener noreferrer' : undefined}
                            sx={{ ml: index > 0 ? 1 : 0 }}
                            aria-label={action.label}
                        >
                            {action.icon}
                        </IconButton>
                    )}
                </Tooltip>
            ))}
        </Box>
    );
};

export default SidebarActions;
