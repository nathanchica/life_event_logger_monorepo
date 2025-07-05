import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EventLabel from '../components/EventLabels/EventLabel';
import { MAX_LABEL_LENGTH } from '../utils/validation';
import ViewOptionsProvider from '../providers/ViewOptionsProvider';

// Mock context hook for LoggableEventsProvider
const mockUpdateEventLabel = jest.fn();
const mockDeleteEventLabel = jest.fn();

// Provide a default set of event labels for validation
const mockEventLabels = [
    { id: '1', name: 'Work' },
    { id: '2', name: 'Duplicate' }
];

jest.mock('../providers/LoggableEventsProvider', () => {
    const actual = jest.requireActual('../providers/LoggableEventsProvider');
    return {
        ...actual,
        useLoggableEventsContext: () => ({
            updateEventLabel: mockUpdateEventLabel,
            deleteEventLabel: mockDeleteEventLabel,
            eventLabels: mockEventLabels
        })
    };
});

const defaultLabel = { id: '1', name: 'Work', createdAt: new Date(), isSynced: true };

function renderWithProvider(ui) {
    return render(<ViewOptionsProvider>{ui}</ViewOptionsProvider>);
}

describe('EventLabel', () => {
    beforeEach(() => {
        mockUpdateEventLabel.mockClear();
        mockDeleteEventLabel.mockClear();
    });

    it('renders label name', () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={false} />);
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('shows edit and delete icons when isShowingEditActions is true', () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('shows textfield and save/cancel icons when editing', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('disables save icon for empty or duplicate or too long name', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByRole('textbox');
        // Empty
        await userEvent.clear(input);
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
        // Too long
        await userEvent.type(input, 'a'.repeat(MAX_LABEL_LENGTH + 1));
        expect(screen.getByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
        // Duplicate
        await userEvent.clear(input);
        await userEvent.type(input, 'Duplicate');
        expect(screen.getByText('Label already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('calls updateEventLabel on save', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Updated');
        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);
        expect(mockUpdateEventLabel).toHaveBeenCalledWith({
            createdAt: defaultLabel.createdAt,
            isSynced: true,
            id: '1',
            name: 'Updated'
        });
    });

    it('calls deleteEventLabel on delete', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        await userEvent.click(deleteButton);
        expect(mockDeleteEventLabel).toHaveBeenCalledWith('1');
    });

    it('restores original label name and exits edit mode when cancel is clicked', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Changed');
        // Click cancel
        await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
        // Should show the original label name and not the text field
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('saves changes when user presses Enter while editing', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Updated');
        await userEvent.keyboard('{Enter}');
        expect(mockUpdateEventLabel).toHaveBeenCalledWith({
            createdAt: defaultLabel.createdAt,
            isSynced: true,
            id: '1',
            name: 'Updated'
        });
        // Should exit edit mode
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('cancels changes when user presses Escape while editing', async () => {
        renderWithProvider(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
        await userEvent.click(screen.getByRole('button', { name: /edit/i }));
        const input = screen.getByRole('textbox');
        await userEvent.clear(input);
        await userEvent.type(input, 'Changed');
        await userEvent.keyboard('{Escape}');
        // Should show the original label name and not the text field
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(mockUpdateEventLabel).not.toHaveBeenCalled();
    });
});
