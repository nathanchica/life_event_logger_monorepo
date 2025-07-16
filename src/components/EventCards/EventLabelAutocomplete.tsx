import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { InputBaseComponentProps } from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';

import { useEventLabels, CreateEventLabelPayload } from '../../hooks/useEventLabels';
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
    const theme = useTheme();

    const isDarkMode = theme.palette.mode === 'dark';

    const labelOptions = existingLabels.filter((label) => !selectedLabels.some(({ id }) => id === label.id));
    const existingLabelNames = existingLabels.map((label) => label.name);

    return (
        <Autocomplete
            multiple
            freeSolo
            options={labelOptions.map(({ name }) => name)}
            value={selectedLabels.map(({ name }) => name)}
            onChange={(_, values, reason) => {
                // Handle label creation separately from selection
                const newLabelsToCreate = values.filter(
                    (val: string) =>
                        reason === 'createOption' &&
                        !existingLabelNames.includes(val) &&
                        !selectedLabels.some((label) => label.name === val)
                );

                // Create new labels if needed
                newLabelsToCreate.forEach((val: string) => {
                    const validationError = validateEventLabelName(val, existingLabelNames);
                    if (validationError === null) {
                        const onCompleted = (payload: { createEventLabel: CreateEventLabelPayload }) => {
                            const newLabel = createEventLabelFromFragment(payload.createEventLabel.eventLabel);
                            setSelectedLabels((prev) => [...prev, newLabel]);
                        };
                        createEventLabel({ name: val }, onCompleted);
                    }
                });

                // Update selected labels with existing labels only
                const existingSelectedLabels = values
                    .map((val: string) => existingLabels.find((label) => label.name === val))
                    .filter((label): label is EventLabel => label !== undefined);

                setSelectedLabels(existingSelectedLabels);
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
                        color={isDarkMode ? 'primary' : 'primary'}
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
