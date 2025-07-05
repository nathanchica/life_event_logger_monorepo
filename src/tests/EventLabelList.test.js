import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';

import EventLabelList from '../components/EventLabels/EventLabelList';
import LoggableEventsProvider from '../providers/LoggableEventsProvider';
import ViewOptionsProvider from '../providers/ViewOptionsProvider';
import { MAX_LABEL_LENGTH } from '../utils/validation';

describe('EventLabelList', () => {
    function renderWithProvider(ui) {
        return render(
            <MockedProvider mocks={[]} addTypename={false}>
                <LoggableEventsProvider offlineMode={true}>
                    <ViewOptionsProvider>{ui}</ViewOptionsProvider>
                </LoggableEventsProvider>
            </MockedProvider>
        );
    }

    it('shows the label creation form when clicking create new label', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
    });

    it('disables check button if name is empty', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            const checkButton = screen.getByRole('button', { name: /Create label/i });
            expect(checkButton).toBeDisabled();
        });
    });

    it('shows error and disables check button for duplicate name', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'Work');
        // Create the label first
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        await userEvent.click(checkButton);
        // Try to create duplicate
        await userEvent.click(await screen.findByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input2 = screen.getByPlaceholderText('Label name');
        await userEvent.type(input2, 'Work');
        expect(screen.getByText('Label already exists')).toBeInTheDocument();
        const checkButton2 = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton2).toBeDisabled();
    });

    it('shows error and disables create for too long names', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'a'.repeat(MAX_LABEL_LENGTH + 1));
        expect(screen.getByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton).toBeDisabled();
    });

    it('cancels label creation on cancel button', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const cancelButton = screen.getByRole('button', { name: /Cancel label creation/ });
        await userEvent.click(cancelButton);
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('cancels label creation on escape key', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, '{Escape}');
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('creates a label when pressing Enter in the input', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, 'EnterLabel{Enter}');
        expect(await screen.findByText('EnterLabel')).toBeInTheDocument();
        // The input should be removed after creation
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('does not create a label when pressing Enter on an empty form', async () => {
        renderWithProvider(<EventLabelList isEditing={false} />);
        await userEvent.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await userEvent.type(input, '{Enter}');
        // The input should still be present
        expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
    });
});
