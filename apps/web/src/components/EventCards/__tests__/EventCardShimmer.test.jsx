import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import EventCardShimmer from '../EventCardShimmer';

describe('EventCardShimmer', () => {
    it.each([['light'], ['dark']])('renders skeleton in %s mode', (themeMode) => {
        const muiTheme = createTheme({
            palette: {
                mode: themeMode
            }
        });

        render(
            <ThemeProvider theme={muiTheme}>
                <EventCardShimmer />
            </ThemeProvider>
        );

        expect(screen.getByTestId('event-card-shimmer')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading event card')).toBeInTheDocument();
    });
});
