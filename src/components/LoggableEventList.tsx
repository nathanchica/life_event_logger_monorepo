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
    const { loggableEvents, updateLoggableEventDetails } = useLoggableEventsContext();

    if (loggableEvents.length === 0) {
        return null;
    }

    const createCheckboxClickHandler = (eventId: string) => async () => {
        const eventToUpdate = loggableEvents.find(({ id }) => id === eventId);
        invariant(eventToUpdate, 'Must be a valid loggable event');
        await updateLoggableEventDetails({
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
                    const labelId = `Toggle ${name}`;
                    return (
                        <ListItem disablePadding key={id}>
                            <ListItemButton dense disableRipple onClick={createCheckboxClickHandler(id)}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={active}
                                        tabIndex={-1}
                                        inputProps={{ 'aria-labelledby': labelId }}
                                    />
                                </ListItemIcon>
                                <ListItemText id={labelId}>{name}</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};

export default LoggableEventList;
