import { useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import { useEventLabels } from '../../hooks/useEventLabels';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';

type Props = {
    onCancel: () => void;
    onSuccess: () => void;
    existingLabelNames: Array<string>;
};

const CreateEventLabelForm = ({ onCancel, onSuccess, existingLabelNames }: Props) => {
    const { createEventLabel, createIsLoading } = useEventLabels();
    const [newLabelName, setNewLabelName] = useState('');

    const validationError = validateEventLabelName(newLabelName, existingLabelNames);
    const isTooLong = validationError === 'TooLongName';
    const isDuplicate = validationError === 'DuplicateName';
    const isEmpty = validationError === 'EmptyName';

    const handleCreateLabel = () => {
        if (validationError === null) {
            createEventLabel({ name: newLabelName.trim() });
            setNewLabelName('');
            onSuccess();
        }
    };

    const handleCancelCreate = () => {
        setNewLabelName('');
        onCancel();
    };

    return (
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
                        isTooLong ? `Max ${MAX_LABEL_LENGTH} characters` : isDuplicate ? 'Label already exists' : ''
                    }
                    InputProps={{
                        sx: {
                            padding: '0px 8px',
                            height: 36
                        }
                    }}
                />
            </Box>
            <IconButton
                onClick={handleCreateLabel}
                size="small"
                color="primary"
                disabled={isTooLong || isDuplicate || isEmpty || createIsLoading}
                sx={{ mt: 0.5 }}
                aria-label="Create label"
            >
                <CheckIcon />
            </IconButton>
        </Box>
    );
};

export default CreateEventLabelForm;
