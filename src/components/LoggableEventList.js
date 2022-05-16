import React, { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { useLoggableEventsContext } from './LoggableEventsProvider';

const LoggableEventList = () => {
    const { loggableEvents, updateLoggableEventIsActive } = useLoggableEventsContext();
    const [checkedCheckboxIds, setCheckedCheckboxIds] = useState(
        loggableEvents.filter(({ active }) => active).map(({ id }) => id)
    );
    const removeIdFromCheckedCheckboxIds = (idToRemove) => {
        setCheckedCheckboxIds((currIds) => currIds.filter((id) => idToRemove !== id));
    };
    const addIdtoCheckedCheckboxIds = (idToAdd) => {
        setCheckedCheckboxIds((currIds) => [...currIds, idToAdd]);
    };

    const createCheckboxClickHandler = (eventId) => () => {
        if (checkedCheckboxIds.includes(eventId)) {
            removeIdFromCheckedCheckboxIds(eventId);
            updateLoggableEventIsActive(eventId, false);
            return;
        }

        addIdtoCheckedCheckboxIds(eventId);
        updateLoggableEventIsActive(eventId, true);
    };

    return (
        <>
            <Typography sx={{ mt: 1 }} variant="h6" component="div">
                Current Events:
            </Typography>
            <List>
                {loggableEvents.map(({ id }) => {
                    return (
                        <ListItem disablePadding key={id}>
                            <ListItemIcon onClick={createCheckboxClickHandler(id)}>
                                <Checkbox
                                    edge="start"
                                    checked={checkedCheckboxIds.includes(id)}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ 'aria-labelledby': id }}
                                />
                            </ListItemIcon>
                            <ListItemText>{id}</ListItemText>
                        </ListItem>
                    );
                })}
            </List>
        </>
    );
};

export default LoggableEventList;
