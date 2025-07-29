import { useState } from 'react';

import { gql, useFragment } from '@apollo/client';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';

import { useEventLabels } from '../../hooks/useEventLabels';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { EventLabel as EventLabelType, EventLabelFragment } from '../../utils/types';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';

const EVENT_LABEL_FRAGMENT = gql`
    fragment EventLabelFragment on EventLabel {
        id
        name
    }
`;

export const createEventLabelFromFragment = ({ id, name }: EventLabelFragment): EventLabelType => {
    return {
        id,
        name
    };
};

type Props = {
    eventLabelId: string;
    isShowingEditActions: boolean;
    existingLabelNames: Array<string>;
};

/**
 * EventLabel component for displaying and editing event labels.
 */
const EventLabel = ({ eventLabelId, isShowingEditActions, existingLabelNames }: Props) => {
    const { data } = useFragment({
        fragment: EVENT_LABEL_FRAGMENT,
        fragmentName: 'EventLabelFragment',
        from: {
            __typename: 'EventLabel',
            id: eventLabelId
        }
    });
    const { id, name } = createEventLabelFromFragment(data);

    const { updateEventLabel, deleteEventLabel, updateIsLoading, deleteIsLoading } = useEventLabels();

    const { activeEventLabelId, setActiveEventLabelId } = useViewOptions();
    const isActive = activeEventLabelId === id;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editValue, setEditValue] = useState(name);

    const shouldValidate = editValue !== name;
    const validationError = shouldValidate ? validateEventLabelName(editValue, existingLabelNames) : null;

    const handleDelete = () => {
        deleteEventLabel({ input: { id } });
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
        if (validationError === null) {
            updateEventLabel({ input: { id, name: editValue.trim() } });
            setIsEditingName(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleLabelClick = () => {
        if (!isShowingEditActions) {
            setActiveEventLabelId(isActive ? null : id);
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
                            disabled={validationError !== null || updateIsLoading}
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
            <ListItemButton dense disableRipple onClick={handleLabelClick} selected={isActive}>
                <ListItemIcon>
                    {isShowingEditActions ? (
                        isEditingName ? (
                            <IconButton edge="start" size="small" onClick={handleCancelEdit} aria-label="cancel">
                                <CancelIcon />
                            </IconButton>
                        ) : (
                            <IconButton
                                edge="start"
                                size="small"
                                onClick={handleDelete}
                                disabled={deleteIsLoading}
                                aria-label="delete"
                            >
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
                                  ? 'Cannot be empty'
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

EventLabel.fragments = {
    eventLabel: EVENT_LABEL_FRAGMENT
};

export default EventLabel;
