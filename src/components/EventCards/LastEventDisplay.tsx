import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import red from '@mui/material/colors/red';
import orange from '@mui/material/colors/orange';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { DAYS_IN_YEAR, DAYS_IN_MONTH } from '../../utils/time';

type Props = {
    daysSinceLastEvent: number;
    warningThresholdInDays: number;
};

const LastEventDisplay = ({ daysSinceLastEvent, warningThresholdInDays }: Props) => {
    const isViolatingThreshold = warningThresholdInDays > 0 && daysSinceLastEvent >= warningThresholdInDays;

    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    let textToDisplay;
    if (daysSinceLastEvent === 0) {
        textToDisplay = `Last event: Today`;
    } else if (daysSinceLastEvent === 1) {
        textToDisplay = `Last event: Yesterday`;
    } else if (daysSinceLastEvent >= DAYS_IN_YEAR) {
        const years = Math.floor(daysSinceLastEvent / DAYS_IN_YEAR);
        textToDisplay = `Last event: ${years} ${years === 1 ? 'year' : 'years'} ago`;
    } else if (daysSinceLastEvent >= DAYS_IN_MONTH) {
        const months = Math.floor(daysSinceLastEvent / DAYS_IN_MONTH);
        textToDisplay = `Last event: ${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
        textToDisplay = `Last event: ${daysSinceLastEvent} days ago`;
    }

    const warningColor = isDarkMode ? orange[500] : red[500];

    return (
        <Box
            css={css`
                margin-top: 8px;
                color: ${isViolatingThreshold ? warningColor : 'inherit'};
            `}
            role="status"
            aria-live={isViolatingThreshold ? 'polite' : 'off'}
            aria-label={isViolatingThreshold ? `Warning: ${textToDisplay}` : textToDisplay}
        >
            <Stack direction="row" spacing={1}>
                <Typography variant="caption">{textToDisplay}</Typography>
                {isViolatingThreshold && (
                    <WarningAmberIcon
                        style={{ color: warningColor }}
                        fontSize="small"
                        aria-label="Warning indicator"
                        role="img"
                    />
                )}
            </Stack>
        </Box>
    );
};

export default LastEventDisplay;
