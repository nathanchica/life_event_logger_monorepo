import { useState, ChangeEventHandler } from 'react';
import invariant from 'tiny-invariant';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';

type Props = {
    eventName: string;
    onClose: () => void;
};

const LoggableEventEditor = ({ eventName, onClose }: Props) => {
    const { loggableEvents, updateLoggableEventName } = useLoggableEventsContext();
    const loggableEventToEdit = loggableEvents.find(({ name }) => name === eventName);

    invariant(loggableEventToEdit, 'Must have a valid loggable event.');

    const [eventNameInputValue, setEventNameInputValue] = useState<string>(loggableEventToEdit.name);

    const handleEventNameInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        setEventNameInputValue(event.currentTarget.value);
    };

    const handleSaveClick = () => {
        updateLoggableEventName(eventName, eventNameInputValue);
        onClose();
    };

    return (
        <Dialog open onClose={onClose}>
            <DialogTitle>Edit event</DialogTitle>
            <DialogContent>
                <TextField
                    id="name"
                    label="Event name"
                    fullWidth
                    variant="standard"
                    value={eventNameInputValue}
                    onChange={handleEventNameInputChange}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveClick}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoggableEventEditor;
