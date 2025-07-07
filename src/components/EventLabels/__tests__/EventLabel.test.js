import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabel } from '../../../mocks/eventLabels';
import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import { MAX_LABEL_LENGTH } from '../../../utils/validation';
import EventLabel from '../EventLabel';

describe('EventLabel', () => {
    const mockUpdateEventLabel = jest.fn();
    const mockDeleteEventLabel = jest.fn();
    const mockSetActiveEventLabelId = jest.fn();

    const defaultLabel = createMockEventLabel({
        id: 'label-1',
        name: 'Work',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        isSynced: true
    });

    const mockViewOptionsContext = createMockViewOptionsContextValue({
        activeEventLabelId: null,
        setActiveEventLabelId: mockSetActiveEventLabelId
    });

    const renderWithProviders = (component, viewOptionsOverrides = {}) => {
        return render(
            <ViewOptionsContext.Provider value={{ ...mockViewOptionsContext, ...viewOptionsOverrides }}>
                {component}
            </ViewOptionsContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders label name', () => {
        renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={false} />);
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    describe('edit actions visibility', () => {
        it('shows edit and delete icons when isShowingEditActions is true', () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
        });

        it('does not show edit and delete icons when isShowingEditActions is false', () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={false} />);
            expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
        });
    });

    describe('edit mode', () => {
        it('shows textfield and save/cancel icons when editing', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        });

        it('restores original label name and exits edit mode when cancel is clicked', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, 'Changed');

            await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });

        it('cancels changes when user presses Escape while editing', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, 'Changed');
            await userEvent.keyboard('{Escape}');

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
            expect(mockUpdateEventLabel).not.toHaveBeenCalled();
        });
    });

    describe('validation', () => {
        it.each([
            ['empty name', '', 'Cannot be empty'],
            ['too long name', 'a'.repeat(MAX_LABEL_LENGTH + 1), `Max ${MAX_LABEL_LENGTH} characters`],
            ['duplicate name', 'Duplicate', 'Label already exists']
        ])('disables save button for %s', async (testCase, inputValue, expectedError) => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);

            if (inputValue) {
                await userEvent.type(input, inputValue);
            }

            expect(screen.getByText(expectedError)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
        });
    });

    describe('save functionality', () => {
        it('calls updateEventLabel on save', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, 'Updated');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await userEvent.click(saveButton);

            expect(mockUpdateEventLabel).toHaveBeenCalledWith({
                id: 'label-1',
                name: 'Updated',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                isSynced: true
            });
        });

        it('saves changes when user presses Enter while editing', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);
            await userEvent.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, 'Updated');
            await userEvent.keyboard('{Enter}');

            expect(mockUpdateEventLabel).toHaveBeenCalledWith({
                id: 'label-1',
                name: 'Updated',
                createdAt: new Date('2023-01-01T00:00:00Z'),
                isSynced: true
            });
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });
    });

    describe('delete functionality', () => {
        it('calls deleteEventLabel on delete', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={true} />);

            const deleteButton = screen.getByRole('button', { name: /delete/i });
            await userEvent.click(deleteButton);

            expect(mockDeleteEventLabel).toHaveBeenCalledWith('label-1');
        });
    });

    describe('label selection', () => {
        it('calls setActiveEventLabelId when label is clicked', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={false} />);

            const labelButton = screen.getByRole('button', { name: /Work/i });
            await userEvent.click(labelButton);

            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith('label-1');
        });

        it('sets activeEventLabelId to null when active label is clicked again', async () => {
            renderWithProviders(<EventLabel {...defaultLabel} isShowingEditActions={false} />, {
                activeEventLabelId: 'label-1'
            });

            const labelButton = screen.getByRole('button', { name: /Work/i });
            await userEvent.click(labelButton);

            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith(null);
        });
    });
});
