/** @jsxImportSource @emotion/react */

import { ReactNode } from 'react';

import { css } from '@emotion/react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import blue from '@mui/material/colors/blue';

const DropdownItem = ({ name, icon, onClick }: { name: string; icon: ReactNode; onClick: () => void }) => (
    <ListItem disablePadding>
        <ListItemButton
            css={css`
                :hover {
                    background-color: ${blue[100]};
                }
            `}
            onClick={onClick}
            role="menuitem"
            aria-label={name}
        >
            <ListItemIcon aria-hidden="true">{icon}</ListItemIcon>
            <ListItemText primary={name} />
        </ListItemButton>
    </ListItem>
);

type EventOptionsDropdownProps = {
    onDismiss: () => void;
    onEditEventClick: () => void;
    onDeleteEventClick: () => void;
};

const EventOptionsDropdown = ({ onDismiss, onEditEventClick, onDeleteEventClick }: EventOptionsDropdownProps) => {
    return (
        <ClickAwayListener onClickAway={onDismiss}>
            <Paper
                elevation={5}
                role="menu"
                aria-label="Event options menu"
                css={css`
                    position: absolute;
                    width: 200px;
                    // https://mui.com/material-ui/customization/z-index/#main-content
                    z-index: 1500;
                `}
            >
                <List disablePadding role="none">
                    <DropdownItem name="Edit event" icon={<EditIcon />} onClick={onEditEventClick} />
                    <DropdownItem name="Delete event" icon={<DeleteIcon />} onClick={onDeleteEventClick} />
                </List>
            </Paper>
        </ClickAwayListener>
    );
};

export default EventOptionsDropdown;
