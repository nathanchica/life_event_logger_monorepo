import invariant from 'invariant';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { useLoggableEventsContext } from './LoggableEventsProvider';

const LoggableEventList = () => {
    const { loggableEvents, updateLoggableEventIsActive } = useLoggableEventsContext();

    const createCheckboxClickHandler = (eventId) => () => {
        const eventToUpdate = loggableEvents.find(({ id }) => id === eventId);
        invariant(eventToUpdate, 'Must be a valid event');
        updateLoggableEventIsActive(eventId, !eventToUpdate.active);
    };

    if (loggableEvents.length === 0) {
        return null;
    }

    return (
        <>
            <Typography variant="h6" component="div">
                Registered events:
            </Typography>
            <List>
                {loggableEvents.map(({ id, active }) => {
                    return (
                        <ListItem disablePadding key={id}>
                            <ListItemIcon onClick={createCheckboxClickHandler(id)}>
                                <Checkbox
                                    edge="start"
                                    checked={active}
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
