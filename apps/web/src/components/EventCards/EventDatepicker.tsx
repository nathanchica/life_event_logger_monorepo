import { useState, useEffect } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import { visuallyHidden } from '@mui/utils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { subDays, isSameDay } from 'date-fns';

type Props = {
    eventId: string;
    isShowing: boolean;
    disabledDates: Date[];
    onAccept: (date: Date) => void;
};

const EventDatepicker = ({ eventId, isShowing, disabledDates, onAccept }: Props) => {
    const getDefaultDate = () => {
        const today = new Date();
        const isDateDisabled = (date: Date) => {
            return disabledDates.some((disabledDate: Date) => isSameDay(disabledDate, date));
        };

        if (!isDateDisabled(today)) {
            return today;
        }

        let pastDate = subDays(today, 1);
        while (isDateDisabled(pastDate)) {
            pastDate = subDays(pastDate, 1);
        }

        return pastDate;
    };

    const [inputValue, setInputValue] = useState<Date | null>(getDefaultDate);

    const inputValueIsValid = inputValue && !disabledDates.some((date) => isSameDay(date, inputValue));

    const handleInputChange = (newDate: Date | null) => {
        setInputValue(newDate);
    };

    const handleDatepickerAccept = (newDate: Date | null) => {
        // safety check, impractical to test else case since the datepicker should always return a valid date
        /* istanbul ignore else */
        if (newDate) {
            setInputValue(newDate);
        }
    };

    const handleConfirm = () => {
        if (inputValueIsValid) {
            onAccept(inputValue!);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    useEffect(() => {
        if (!isShowing) {
            setInputValue(getDefaultDate);
        }
    }, [isShowing]);

    const helperText = inputValueIsValid ? 'Pick a date to log an event for' : 'Selected date is already logged';

    return (
        <Collapse in={isShowing} orientation="vertical">
            <ListItem disablePadding>
                <Stack
                    sx={{ pt: 2, pb: 2 }}
                    direction="row"
                    alignItems="flex-start"
                    id={`datepicker-${eventId}`}
                    role="group"
                    aria-label="Select date to log event"
                >
                    <DatePicker
                        label="Event date"
                        format="MM/d/yyyy"
                        value={inputValue}
                        onChange={handleInputChange}
                        shouldDisableDate={(date) => disabledDates.some((record: Date) => isSameDay(record, date))}
                        onAccept={handleDatepickerAccept}
                        slotProps={{
                            textField: {
                                size: 'small',
                                helperText,
                                'aria-describedby': `datepicker-help-${eventId}`,
                                onKeyDown: handleKeyDown
                            }
                        }}
                        autoFocus
                        aria-label="Event datepicker"
                        aria-describedby={`datepicker-help-${eventId}`}
                    />
                    <Box id={`datepicker-help-${eventId}`} sx={visuallyHidden}>
                        Dates already logged are disabled
                    </Box>
                    <IconButton
                        onClick={handleConfirm}
                        disabled={!inputValueIsValid}
                        aria-label="Confirm date selection"
                    >
                        <CheckIcon />
                    </IconButton>
                </Stack>
            </ListItem>
        </Collapse>
    );
};

export default EventDatepicker;
