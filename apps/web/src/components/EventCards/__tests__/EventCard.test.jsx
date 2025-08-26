import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import EventCard from '../EventCard';

describe('EventCard', () => {
    it.each([['light'], ['dark']])('renders in %s mode', (themeMode) => {
        const muiTheme = createTheme({
            palette: {
                mode: themeMode
            }
        });

        render(
            <ThemeProvider theme={muiTheme}>
                <EventCard>
                    <div>Test content</div>
                </EventCard>
            </ThemeProvider>
        );

        expect(screen.getByRole('article', { name: 'Event card' })).toBeInTheDocument();
        expect(screen.getByText('Test content')).toBeInTheDocument();
    });
});
