/** @jsxImportSource @emotion/react */

import { ReactNode, useEffect, useRef, useState } from 'react';

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
import { blue } from '@mui/material/colors';

const DROPDOWN_WIDTH = 200;

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
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [alignRight, setAlignRight] = useState(false);

    useEffect(() => {
        // istanbul ignore else
        if (dropdownRef.current) {
            const parentRect = dropdownRef.current.parentElement?.getBoundingClientRect();

            // istanbul ignore else
            if (parentRect) {
                // Check if dropdown would overflow right edge of viewport
                const wouldOverflowRight = parentRect.left + DROPDOWN_WIDTH > window.innerWidth;
                setAlignRight(wouldOverflowRight);
            }
        }
    }, []);

    return (
        <ClickAwayListener onClickAway={onDismiss}>
            <Paper
                ref={dropdownRef}
                elevation={5}
                role="menu"
                aria-label="Event options menu"
                css={css`
                    position: absolute;
                    width: ${DROPDOWN_WIDTH}px;
                    top: 100%;
                    // https://mui.com/material-ui/customization/z-index/#main-content
                    z-index: 1500;
                    ${alignRight ? 'right: 0;' : 'left: 0;'}
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
