import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';

import EventLabel from './EventLabel';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';

type Props = {
    isEditing: boolean;
};

/**
 * EventLabelList component for displaying and managing a list of event labels.
 */
const EventLabelList = ({ isEditing }: Props) => {
    const { eventLabels, createEventLabel } = useLoggableEventsContext();
    const [newLabelFormIsShowing, setNewLabelFormIsShowing] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');

    const validationError = validateEventLabelName(newLabelName, eventLabels);
    const isTooLong = validationError === 'TooLongName';
    const isDuplicate = validationError === 'DuplicateName';
    const isEmpty = validationError === 'EmptyName';

    const handleCreateLabel = async () => {
        if (validationError === null) {
            await createEventLabel(newLabelName.trim());
            setNewLabelName('');
            setNewLabelFormIsShowing(false);
        }
    };

    const handleCancelCreate = () => {
        setNewLabelName('');
        setNewLabelFormIsShowing(false);
    };

    return (
        <Box>
            <List disablePadding>
                <ListItem disablePadding>
                    {newLabelFormIsShowing ? (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '90%' }}>
                            <IconButton
                                onClick={handleCancelCreate}
                                size="small"
                                color="default"
                                sx={{ ml: 1.25, mr: 1, mt: 0.5 }}
                                aria-label="Cancel label creation"
                            >
                                <CancelIcon />
                            </IconButton>
                            <Box sx={{ flex: 1, mr: 1 }}>
                                <TextField
                                    size="small"
                                    variant="standard"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateLabel();
                                        if (e.key === 'Escape') handleCancelCreate();
                                    }}
                                    autoFocus
                                    placeholder="Label name"
                                    fullWidth
                                    error={isTooLong || isDuplicate}
                                    helperText={
                                        isTooLong
                                            ? `Max ${MAX_LABEL_LENGTH} characters`
                                            : isDuplicate
                                              ? 'Label already exists'
                                              : ''
                                    }
                                    InputProps={{
                                        sx: {
                                            padding: '0px 8px', // reduce vertical and horizontal padding
                                            height: 36
                                        }
                                    }}
                                />
                            </Box>
                            <IconButton
                                onClick={handleCreateLabel}
                                size="small"
                                color="primary"
                                disabled={isTooLong || isDuplicate || isEmpty}
                                sx={{ mt: 0.5 }}
                                aria-label="Create label"
                            >
                                <CheckIcon />
                            </IconButton>
                        </Box>
                    ) : (
                        <ListItemButton dense disableRipple onClick={() => setNewLabelFormIsShowing(true)}>
                            <ListItemIcon>
                                <AddIcon />
                            </ListItemIcon>
                            <ListItemText primary="Create new label" />
                        </ListItemButton>
                    )}
                </ListItem>

                {eventLabels.map((eventLabelData) => (
                    <EventLabel key={eventLabelData.id} {...eventLabelData} isShowingEditActions={isEditing} />
                ))}
            </List>
        </Box>
    );
};

export default EventLabelList;
