import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateEventCard from '../CreateEventCard';

jest.mock('../EditEventCard', () => {
    return function MockEditEventCard({ onDismiss }) {
        return (
            <div>
                <label htmlFor="event-name">Event name</label>
                <input id="event-name" type="text" />
                <button onClick={onDismiss}>Cancel</button>
            </div>
        );
    };
});

describe('CreateEventCard', () => {
    let user;

    beforeEach(() => {
        user = userEvent.setup();
        jest.clearAllMocks();
    });

    it('renders the add event button', () => {
        render(<CreateEventCard />);

        const addButton = screen.getByRole('button', { name: 'Add event' });
        expect(addButton).toBeInTheDocument();
        expect(addButton).toBeEnabled();
    });

    it('toggles between card and form views', async () => {
        render(<CreateEventCard />);

        // Initial state - card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();

        // Click to show form
        const addButton = screen.getByRole('button', { name: 'Add event' });
        await user.click(addButton);

        // Form view
        expect(screen.queryByRole('button', { name: 'Add event' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Event name')).toBeInTheDocument();

        // Cancel to return to card view
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await user.click(cancelButton);

        // Back to card view
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
    });
});
