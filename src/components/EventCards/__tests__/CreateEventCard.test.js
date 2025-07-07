import { MockedProvider } from '@apollo/client/testing';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import CreateEventCard from '../CreateEventCard';

describe('CreateEventCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (component) => {
        const mockViewOptionsValue = createMockViewOptionsContextValue();

        return render(
            <MockedProvider mocks={[]} addTypename={false}>
                <ViewOptionsContext.Provider value={mockViewOptionsValue}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>{component}</LocalizationProvider>
                </ViewOptionsContext.Provider>
            </MockedProvider>
        );
    };

    it('renders the add event button', () => {
        renderWithProviders(<CreateEventCard />);

        const addButton = screen.getByRole('button', { name: 'Add event' });
        expect(addButton).toBeInTheDocument();
        expect(addButton).toBeEnabled();
    });

    it('toggles between card and form views', async () => {
        renderWithProviders(<CreateEventCard />);

        // Initial state - card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();

        // Click to show form
        const addButton = screen.getByRole('button', { name: 'Add event' });
        await userEvent.click(addButton);

        // Form view
        expect(screen.queryByRole('button', { name: 'Add event' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Event name')).toBeInTheDocument();

        // Cancel to return to card view
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await userEvent.click(cancelButton);

        // Back to card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
    });
});
