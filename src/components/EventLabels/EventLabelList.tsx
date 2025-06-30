import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import LabelIcon from '@mui/icons-material/Label';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';

import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { EventLabelColor } from '../../providers/LoggableEventsProvider';

export const MAX_LABEL_LENGTH = 24;

const EventLabelList = () => {
    const { eventLabels, createEventLabel } = useLoggableEventsContext();
    const [newLabelFormIsShowing, setNewLabelFormIsShowing] = useState(false);
    const [newLabelAlias, setNewLabelAlias] = useState('');

    const aliasExists = eventLabels.some(
        (label) => label.alias.trim().toLowerCase() === newLabelAlias.trim().toLowerCase()
    );

    const handleCreateLabel = async () => {
        if (newLabelAlias.trim() && newLabelAlias.length <= MAX_LABEL_LENGTH && !aliasExists) {
            await createEventLabel(newLabelAlias.trim(), EventLabelColor.Blue);
            setNewLabelAlias('');
            setNewLabelFormIsShowing(false);
        }
    };

    const handleCancelCreate = () => {
        setNewLabelAlias('');
        setNewLabelFormIsShowing(false);
    };

    const isTooLong = newLabelAlias.length > MAX_LABEL_LENGTH;
    const isDuplicate = !!newLabelAlias && aliasExists;
    const isEmpty = newLabelAlias.trim() === '';

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
                                    variant="outlined"
                                    value={newLabelAlias}
                                    onChange={(e) => setNewLabelAlias(e.target.value)}
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

                {eventLabels.map(({ id, alias }) => {
                    return (
                        <ListItem disablePadding key={id}>
                            <ListItemButton dense disableRipple>
                                <ListItemIcon>
                                    <LabelIcon />
                                </ListItemIcon>
                                <ListItemText id={id}>{alias}</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};

export default EventLabelList;
