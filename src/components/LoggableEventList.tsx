import invariant from 'tiny-invariant';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { useLoggableEventsContext } from './LoggableEventsProvider';

const LoggableEventList = () => {
    const { loggableEvents, updateLoggableEventIsActive } = useLoggableEventsContext();

    if (loggableEvents.length === 0) {
        return null;
    }

    const createCheckboxClickHandler = (eventName: string) => () => {
        const eventToUpdate = loggableEvents.find(({ name }) => name === eventName);
        invariant(eventToUpdate, 'Must be a valid loggable event');
        updateLoggableEventIsActive(eventName, !eventToUpdate.active);
    };

    return (
        <>
            <Typography variant="h6" component="div">
                Registered events:
            </Typography>
            <List>
                {loggableEvents.map(({ name, active }) => {
                    return (
                        <ListItem disablePadding key={name}>
                            <ListItemIcon onClick={createCheckboxClickHandler(name)}>
                                <Checkbox
                                    edge="start"
                                    checked={active}
                                    tabIndex={-1}
                                    disableRipple
                                    inputProps={{ 'aria-labelledby': name }}
                                />
                            </ListItemIcon>
                            <ListItemText>{name}</ListItemText>
                        </ListItem>
                    );
                })}
            </List>
        </>
    );
};

export default LoggableEventList;
