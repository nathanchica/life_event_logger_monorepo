import { useState } from 'react';

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { convertDaysToUnitAndNumber, DAYS_IN_MONTH, DAYS_IN_YEAR, TimeUnit } from '../../utils/time';

type Props = {
    onChange: (thresholdInDays: number) => void;
    initialThresholdInDays: number;
};

const WarningThresholdForm = ({ onChange, initialThresholdInDays }: Props) => {
    const { number: initialNumber, unit: initialUnit } = convertDaysToUnitAndNumber(initialThresholdInDays);
    const [numberValue, setNumberValue] = useState(initialNumber);
    const [unitValue, setUnitValue] = useState(initialUnit);

    const calculateDays = (num: number, unit: TimeUnit): number => {
        switch (unit) {
            case 'days':
                return num;
            case 'months':
                return num * DAYS_IN_MONTH;
            case 'years':
                return num * DAYS_IN_YEAR;
        }
    };

    const getMaxValue = (unit: TimeUnit): number => {
        switch (unit) {
            case 'days':
                return 31;
            case 'months':
                return 12;
            case 'years':
                return 10;
        }
    };

    const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const maxValue = getMaxValue(unitValue);

        if (value === '') {
            setNumberValue(0);
            onChange(0);
        } else {
            const newNumber = parseInt(value);
            if (newNumber >= 0 && newNumber <= maxValue) {
                setNumberValue(newNumber);
                onChange(calculateDays(newNumber, unitValue));
            }
        }
    };

    const handleUnitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newUnit = event.target.value as TimeUnit;
        const maxValue = getMaxValue(newUnit);

        // If current number exceeds new unit's max, reset to 1
        if (numberValue > maxValue) {
            setNumberValue(1);
            onChange(calculateDays(1, newUnit));
        } else {
            onChange(calculateDays(numberValue, newUnit));
        }

        setUnitValue(newUnit);
    };

    return (
        <Box
            sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
            role="group"
            aria-labelledby="warning-threshold-group-label"
        >
            <TextField
                id="warning-threshold-number"
                label="Warning threshold"
                helperText={`Enter a number between 0-${getMaxValue(unitValue)}`}
                type="number"
                variant="standard"
                margin="normal"
                value={numberValue === 0 ? '' : numberValue}
                onChange={handleNumberChange}
                inputProps={{
                    min: 0,
                    max: getMaxValue(unitValue),
                    'aria-label': 'Warning threshold number'
                }}
                sx={{ flex: 1 }}
            />
            <TextField
                id="warning-threshold-unit"
                select
                label="Unit"
                helperText=" "
                variant="standard"
                margin="normal"
                value={unitValue}
                onChange={handleUnitChange}
                inputProps={{
                    'aria-label': 'Warning threshold time unit'
                }}
                sx={{ flex: 1 }}
            >
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="months">Months</MenuItem>
                <MenuItem value="years">Years</MenuItem>
            </TextField>
        </Box>
    );
};

export default WarningThresholdForm;
