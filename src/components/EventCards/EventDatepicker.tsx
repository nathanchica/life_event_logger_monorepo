import { useState, useEffect } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import { visuallyHidden } from '@mui/utils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment, { Moment } from 'moment';

type Props = {
    eventId: string;
    isShowing: boolean;
    disabledDates: Date[];
    onAccept: (date: Date) => void;
};

const EventDatepicker = ({ eventId, isShowing, disabledDates, onAccept }: Props) => {
    const getDefaultDate = () => {
        const today = moment();
        const isDateDisabled = (date: Moment) => {
            return disabledDates.some(
                (disabledDate: Date) => disabledDate.toDateString() === date.toDate().toDateString()
            );
        };

        if (!isDateDisabled(today)) {
            return today;
        }

        let pastDate = today.clone().subtract(1, 'day');
        while (isDateDisabled(pastDate)) {
            pastDate = pastDate.subtract(1, 'day');
        }

        return pastDate;
    };

    const [inputValue, setInputValue] = useState<Moment | null>(getDefaultDate);

    const inputValueIsValid =
        inputValue && !disabledDates.some((date) => date.toDateString() === inputValue.toDate().toDateString());

    const handleInputChange = (newDate: Moment | null) => {
        setInputValue(newDate);
    };

    const handleDatepickerAccept = (newDate: Moment | null) => {
        if (newDate) {
            setInputValue(newDate);
        }
    };

    const handleConfirm = () => {
        if (inputValueIsValid) {
            onAccept(inputValue!.toDate());
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
                        format="MM/D/YYYY"
                        value={inputValue}
                        onChange={handleInputChange}
                        shouldDisableDate={(date) =>
                            disabledDates.some((record: Date) => record.toDateString() === date.toDate().toDateString())
                        }
                        onAccept={handleDatepickerAccept}
                        slotProps={{
                            textField: {
                                size: 'small',
                                helperText: 'Pick a date to log an event for',
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
