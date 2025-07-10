import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { InputBaseComponentProps } from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';

import { useEventLabels } from '../../hooks/useEventLabels';
import { EventLabel } from '../../utils/types';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';
import { createEventLabelFromFragment } from '../EventLabels/EventLabel';

type Props = {
    selectedLabels: EventLabel[];
    setSelectedLabels: React.Dispatch<React.SetStateAction<EventLabel[]>>;
    existingLabels: EventLabel[];
};

/**
 * EventLabelAutocomplete component for selecting and creating event labels.
 * It allows users to search for existing labels or create new ones.
 * The component uses an Autocomplete input with multiple selection enabled.
 */
const EventLabelAutocomplete = ({ selectedLabels, setSelectedLabels, existingLabels }: Props) => {
    const { createEventLabel } = useEventLabels();

    const labelOptions = existingLabels.filter((label) => !selectedLabels.some(({ id }) => id === label.id));
    const existingLabelNames = existingLabels.map((label) => label.name);

    return (
        <Autocomplete
            multiple
            freeSolo
            options={labelOptions.map(({ name }) => name)}
            value={selectedLabels.map(({ name }) => name)}
            onChange={(_, values, reason) => {
                setSelectedLabels((prevLabels: EventLabel[]) => {
                    let newLabel: EventLabel | undefined;
                    values.forEach((val: string) => {
                        // Skip if the label already exists in the selected labels
                        if (prevLabels.some((label: EventLabel) => label.name === val)) return;
                        // Create new label if it doesn't exist
                        if (reason === 'createOption' && !existingLabelNames.includes(val)) {
                            const validationError = validateEventLabelName(val, existingLabelNames);
                            if (validationError === null) {
                                // Create the label asynchronously
                                createEventLabel({ name: val }).then((payload) => {
                                    if (payload?.eventLabel) {
                                        newLabel = createEventLabelFromFragment(payload.eventLabel);
                                        setSelectedLabels((prev) => [...prev, newLabel as EventLabel]);
                                    }
                                });
                                // Don't add to newLabel since it's async
                                return;
                            }
                        } else {
                            newLabel = existingLabels.find((label: EventLabel) => label.name === val);
                        }
                    });
                    const filteredLabels = prevLabels.filter((label: EventLabel) => values.includes(label.name));
                    return [...filteredLabels, ...(newLabel ? [newLabel] : [])];
                });
            }}
            renderValue={(value, getTagProps) =>
                value.map((option, index) => {
                    const label = existingLabels.find((label) => label.name === option);
                    if (!label) return null;
                    return <Chip label={label.name} size="small" {...getTagProps({ index })} key={label.id} />;
                })
            }
            renderInput={(params) => {
                const inputValue = (params.inputProps as InputBaseComponentProps).value || '';
                let error = false;
                let helperText = '';
                if (inputValue) {
                    const validationError = validateEventLabelName(inputValue, existingLabelNames);
                    if (validationError === 'TooLongName') {
                        error = true;
                        helperText = `Max ${MAX_LABEL_LENGTH} characters`;
                    }
                }
                return (
                    <TextField
                        {...params}
                        variant="standard"
                        label="Labels"
                        placeholder="Type to search or create labels"
                        autoFocus
                        error={error}
                        helperText={helperText}
                    />
                );
            }}
            sx={{ mt: 2, mb: 1 }}
            disableCloseOnSelect
            blurOnSelect
        />
    );
};

export default EventLabelAutocomplete;
