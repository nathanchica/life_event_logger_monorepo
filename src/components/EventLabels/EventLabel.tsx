import { useState } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import LabelIcon from '@mui/icons-material/Label';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';

import { useLoggableEventsContext, EventLabel as EventLabelType } from '../../providers/LoggableEventsProvider';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';

type Props = {
    data: EventLabelType;
    isShowingEditActions: boolean;
};

/**
 * EventLabel component for displaying and editing event labels.
 */
const EventLabel = ({ data, isShowingEditActions }: Props) => {
    const { updateEventLabel, deleteEventLabel, eventLabels } = useLoggableEventsContext();
    const { id, name } = data;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editValue, setEditValue] = useState(name);

    const shouldValidate = editValue !== name;
    const validationError = shouldValidate ? validateEventLabelName(editValue, eventLabels) : null;

    const handleDelete = () => {
        deleteEventLabel(id);
    };

    const handleEditClick = () => {
        setIsEditingName(true);
        setEditValue(name);
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setEditValue(name);
    };

    const handleEditSave = () => {
        setIsEditingName(false);
        updateEventLabel({ ...data, name: editValue.trim() });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && validationError === null) {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <ListItem
            disablePadding
            key={id}
            secondaryAction={
                isShowingEditActions ? (
                    isEditingName ? (
                        <IconButton
                            edge="end"
                            size="small"
                            onClick={handleEditSave}
                            disabled={validationError !== null}
                            aria-label="save"
                        >
                            <CheckIcon />
                        </IconButton>
                    ) : (
                        <IconButton edge="end" size="small" onClick={handleEditClick} aria-label="edit">
                            <EditIcon />
                        </IconButton>
                    )
                ) : null
            }
        >
            <ListItemButton dense disableRipple>
                <ListItemIcon>
                    {isShowingEditActions ? (
                        isEditingName ? (
                            <IconButton edge="start" size="small" onClick={handleCancelEdit} aria-label="cancel">
                                <CancelIcon />
                            </IconButton>
                        ) : (
                            <IconButton edge="start" size="small" onClick={handleDelete} aria-label="delete">
                                <DeleteIcon />
                            </IconButton>
                        )
                    ) : (
                        <LabelIcon />
                    )}
                </ListItemIcon>
                {isShowingEditActions && isEditingName ? (
                    <TextField
                        size="small"
                        variant="standard"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        sx={{ maxWidth: 120 }}
                        error={validationError !== null}
                        helperText={
                            validationError === 'TooLongName'
                                ? `Max ${MAX_LABEL_LENGTH} characters`
                                : validationError === 'EmptyName'
                                  ? 'Label cannot be empty'
                                  : validationError === 'DuplicateName'
                                    ? 'Label already exists'
                                    : ''
                        }
                    />
                ) : (
                    <ListItemText id={id}>{name}</ListItemText>
                )}
            </ListItemButton>
        </ListItem>
    );
};

export default EventLabel;
