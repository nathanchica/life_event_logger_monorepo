import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import invariant from 'tiny-invariant';

import CreateEventLabelForm from './CreateEventLabelForm';
import EventLabel from './EventLabel';

import { useLoggableEventsForUser } from '../../hooks/useLoggableEventsForUser';
import { useAuth } from '../../providers/AuthProvider';

type Props = {
    isShowingEditActions: boolean;
};

/**
 * EventLabelList component for displaying and managing a list of event labels.
 */
const EventLabelList = ({ isShowingEditActions }: Props) => {
    const { user } = useAuth();

    invariant(user, 'User is not authenticated');

    const { eventLabelsFragments } = useLoggableEventsForUser(user);
    const existingLabelNames = eventLabelsFragments.map((fragment) => fragment.name);
    const [createLabelFormIsShowing, setCreateLabelFormIsShowing] = useState(false);

    const showCreateLabelForm = () => {
        setCreateLabelFormIsShowing(true);
    };
    const hideCreateLabelForm = () => {
        setCreateLabelFormIsShowing(false);
    };

    return (
        <Box>
            <List disablePadding>
                <ListItem disablePadding>
                    {createLabelFormIsShowing ? (
                        <CreateEventLabelForm
                            onCancel={hideCreateLabelForm}
                            onSuccess={hideCreateLabelForm}
                            existingLabelNames={existingLabelNames}
                        />
                    ) : (
                        <ListItemButton dense disableRipple onClick={showCreateLabelForm}>
                            <ListItemIcon>
                                <AddIcon />
                            </ListItemIcon>
                            <ListItemText primary="Create new label" />
                        </ListItemButton>
                    )}
                </ListItem>

                {eventLabelsFragments.map((eventLabelFragment) => {
                    return (
                        <EventLabel
                            key={eventLabelFragment.id}
                            eventLabelFragment={eventLabelFragment}
                            isShowingEditActions={isShowingEditActions}
                            existingLabelNames={existingLabelNames}
                        />
                    );
                })}
            </List>
        </Box>
    );
};

export default EventLabelList;
