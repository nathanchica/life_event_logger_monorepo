import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';

import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';
import { useLoggableEventsContext, EventLabel } from '../../providers/LoggableEventsProvider';

type Props = {
    selectedLabels: EventLabel[];
    setSelectedLabels: React.Dispatch<React.SetStateAction<EventLabel[]>>;
};

const EventLabelAutocomplete = ({ selectedLabels, setSelectedLabels }: Props) => {
    const { eventLabels, createEventLabel } = useLoggableEventsContext();
    const labelOptions = eventLabels.filter((label) => !selectedLabels.some(({ id }) => id === label.id));

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
                        if (reason === 'createOption' && !eventLabels.some((label) => label.name === val)) {
                            const validationError = validateEventLabelName(val, eventLabels);
                            if (validationError === null) {
                                newLabel = createEventLabel(val);
                            }
                        } else {
                            newLabel = eventLabels.find((label: EventLabel) => label.name === val);
                        }
                    });
                    const filteredLabels = prevLabels.filter((label: EventLabel) => values.includes(label.name));
                    return [...filteredLabels, ...(newLabel ? [newLabel] : [])];
                });
            }}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                    const { id, name } = eventLabels.find(({ name }) => name === option) as EventLabel;
                    return <Chip label={name} size="small" {...getTagProps({ index })} key={id} />;
                })
            }
            renderInput={(params) => {
                const inputValue = (params.inputProps as any).value || '';
                let error = false;
                let helperText = '';
                if (inputValue) {
                    const validationError = validateEventLabelName(inputValue, eventLabels);
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
