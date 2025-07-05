import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';

import EventLabel from './EventLabel';
import CreateEventLabelForm from './CreateEventLabelForm';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';

type Props = {
    isShowingEditActions: boolean;
};

/**
 * EventLabelList component for displaying and managing a list of event labels.
 */
const EventLabelList = ({ isShowingEditActions }: Props) => {
    const { eventLabels } = useLoggableEventsContext();
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
                        <CreateEventLabelForm onCancel={hideCreateLabelForm} onSuccess={hideCreateLabelForm} />
                    ) : (
                        <ListItemButton dense disableRipple onClick={showCreateLabelForm}>
                            <ListItemIcon>
                                <AddIcon />
                            </ListItemIcon>
                            <ListItemText primary="Create new label" />
                        </ListItemButton>
                    )}
                </ListItem>

                {eventLabels.map((eventLabelData) => (
                    <EventLabel
                        key={eventLabelData.id}
                        {...eventLabelData}
                        isShowingEditActions={isShowingEditActions}
                    />
                ))}
            </List>
        </Box>
    );
};

export default EventLabelList;
