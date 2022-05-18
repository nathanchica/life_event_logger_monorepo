import invariant from 'tiny-invariant';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';

const LoggableEventList = () => {
    const { loggableEvents, updateLoggableEvent } = useLoggableEventsContext();

    if (loggableEvents.length === 0) {
        return null;
    }

    const createCheckboxClickHandler = (eventId: string) => async () => {
        const eventToUpdate = loggableEvents.find(({ id }) => id === eventId);
        invariant(eventToUpdate, 'Must be a valid loggable event');
        await updateLoggableEvent({
            ...eventToUpdate,
            active: !eventToUpdate.active
        });
    };

    return (
        <Box
            css={css`
                margin-top: 16px;
            `}
        >
            <Typography variant="subtitle1">Registered events</Typography>
            <List disablePadding>
                {loggableEvents.map(({ id, name, active }) => {
                    return (
                        <ListItem disablePadding key={name}>
                            <ListItemButton dense disableRipple onClick={createCheckboxClickHandler(id)}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={active}
                                        tabIndex={-1}
                                        inputProps={{ 'aria-labelledby': `${name}-isactive-toggle` }}
                                    />
                                </ListItemIcon>
                                <ListItemText>{name}</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};

export default LoggableEventList;
