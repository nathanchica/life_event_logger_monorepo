import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventLabelList, { MAX_LABEL_LENGTH } from '../components/EventLabels/EventLabelList';

// Mock context provider for LoggableEventsProvider
const mockCreateEventLabel = jest.fn();
const mockEventLabels = [
    { id: '1', alias: 'Work' },
    { id: '2', alias: 'Personal' }
];

jest.mock('../providers/LoggableEventsProvider', () => {
    const actual = jest.requireActual('../providers/LoggableEventsProvider');
    return {
        ...actual,
        useLoggableEventsContext: () => ({
            eventLabels: mockEventLabels,
            createEventLabel: mockCreateEventLabel
        }),
        EventLabelColor: { Blue: 'blue' }
    };
});

describe('EventLabelList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders existing labels', () => {
        render(<EventLabelList />);
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('shows the label creation form when clicking create new label', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
    });

    it('disables check button if alias is empty', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton).toBeDisabled();
    });

    it('shows error and disables check button for duplicate alias', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'Work');
        expect(screen.getByText('Label already exists')).toBeInTheDocument();
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton).toBeDisabled();
    });

    it('shows error and disables create for too long alias', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'a'.repeat(MAX_LABEL_LENGTH + 1));
        expect(screen.getByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton).toBeDisabled();
    });

    it('calls createEventLabel with correct value', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'NewLabel');
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        await userEvent.click(checkButton);
        expect(mockCreateEventLabel).toHaveBeenCalledWith('NewLabel', 'blue');
    });

    it('cancels label creation on cancel button', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        const cancelButton = screen.getByRole('button', { name: /Cancel label creation/ });
        await userEvent.click(cancelButton);
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('cancels label creation on escape key', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, '{Escape}');
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('creates a label when pressing Enter in the input', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'EnterLabel{Enter}');
        expect(mockCreateEventLabel).toHaveBeenCalledWith('EnterLabel', 'blue');
        await waitForElementToBeRemoved(() => screen.queryByPlaceholderText('Label name'));
    });

    it('does not create a label when pressing Enter on an empty form', async () => {
        render(<EventLabelList />);
        await userEvent.click(screen.getByText('Create new label'));
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, '{Enter}');
        expect(mockCreateEventLabel).not.toHaveBeenCalled();
        // The input should still be present
        expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
    });
});
