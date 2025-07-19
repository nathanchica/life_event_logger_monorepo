import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import { MAX_LABEL_LENGTH } from '../../../utils/validation';
import EventLabel from '../EventLabel';

// Mock useEventLabels hook
const mockUpdateEventLabel = jest.fn();
const mockDeleteEventLabel = jest.fn();

jest.mock('../../../hooks/useEventLabels', () => ({
    useEventLabels: () => ({
        updateEventLabel: mockUpdateEventLabel,
        deleteEventLabel: mockDeleteEventLabel,
        updateIsLoading: false,
        deleteIsLoading: false
    })
}));

describe('EventLabel', () => {
    let apolloCache;
    let user;
    const mockSetActiveEventLabelId = jest.fn();

    const defaultLabel = createMockEventLabelFragment({
        id: 'label-1',
        name: 'Work'
    });

    const mockViewOptionsContext = createMockViewOptionsContextValue({
        activeEventLabelId: null,
        setActiveEventLabelId: mockSetActiveEventLabelId
    });

    beforeEach(() => {
        user = userEvent.setup();
        apolloCache = new InMemoryCache();

        // Prepopulate cache with default label
        apolloCache.writeFragment({
            id: apolloCache.identify(defaultLabel),
            fragment: EventLabel.fragments.eventLabel,
            data: defaultLabel
        });
    });

    const renderWithProviders = (component, viewOptionsOverrides = {}) => {
        return render(
            <MockedProvider cache={apolloCache} addTypename={false}>
                <ViewOptionsContext.Provider value={{ ...mockViewOptionsContext, ...viewOptionsOverrides }}>
                    {component}
                </ViewOptionsContext.Provider>
            </MockedProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders label name', () => {
        renderWithProviders(
            <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={false} existingLabelNames={[]} />
        );
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    describe('edit actions visibility', () => {
        it('shows edit and delete icons when isShowingEditActions is true', () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
        });

        it('does not show edit and delete icons when isShowingEditActions is false', () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={false} existingLabelNames={[]} />
            );
            expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
        });
    });

    describe('edit mode', () => {
        it('shows textfield and save/cancel icons when editing', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            expect(screen.getByRole('textbox')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        });

        it('restores original label name and exits edit mode when cancel is clicked', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);
            await user.type(input, 'Changed');

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });

        it('cancels changes when user presses Escape while editing', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);
            await user.type(input, 'Changed');
            await user.keyboard('{Escape}');

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });
    });

    describe('validation', () => {
        it.each([
            ['empty name', '', 'Cannot be empty'],
            ['too long name', 'a'.repeat(MAX_LABEL_LENGTH + 1), `Max ${MAX_LABEL_LENGTH} characters`],
            ['duplicate name', 'Duplicate', 'Label already exists']
        ])('disables save button for %s', async (_, inputValue, expectedError) => {
            const existingNames = inputValue === 'Duplicate' ? ['Duplicate'] : [];
            renderWithProviders(
                <EventLabel
                    eventLabelId={defaultLabel.id}
                    isShowingEditActions={true}
                    existingLabelNames={existingNames}
                />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);

            if (inputValue) {
                await user.type(input, inputValue);
            }

            expect(screen.getByText(expectedError)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
        });
    });

    describe('save functionality', () => {
        it('calls updateEventLabel on save', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);
            await user.type(input, 'Updated');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            expect(mockUpdateEventLabel).toHaveBeenCalledWith({
                input: {
                    id: 'label-1',
                    name: 'Updated'
                }
            });
        });

        it('saves changes when user presses Enter while editing', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);
            await user.type(input, 'Updated');
            await user.keyboard('{Enter}');

            expect(mockUpdateEventLabel).toHaveBeenCalledWith({
                input: {
                    id: 'label-1',
                    name: 'Updated'
                }
            });
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });

        it('does not save changes when user presses Enter while editing a label with invalid name', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );
            await user.click(screen.getByRole('button', { name: /edit/i }));

            const input = screen.getByRole('textbox');
            await user.clear(input);
            await user.type(input, 'a'.repeat(MAX_LABEL_LENGTH + 1));
            await user.keyboard('{Enter}');

            expect(mockUpdateEventLabel).not.toHaveBeenCalled();
            expect(screen.queryByRole('textbox')).toBeInTheDocument();
        });
    });

    describe('delete functionality', () => {
        it('calls deleteEventLabel on delete', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={true} existingLabelNames={[]} />
            );

            const deleteButton = screen.getByRole('button', { name: /delete/i });
            await user.click(deleteButton);

            expect(mockDeleteEventLabel).toHaveBeenCalledWith({ input: { id: 'label-1' } });
        });
    });

    describe('label selection', () => {
        it('calls setActiveEventLabelId when label is clicked', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={false} existingLabelNames={[]} />
            );

            const labelButton = screen.getByRole('button', { name: /Work/i });
            await user.click(labelButton);

            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith('label-1');
        });

        it('sets activeEventLabelId to null when active label is clicked again', async () => {
            renderWithProviders(
                <EventLabel eventLabelId={defaultLabel.id} isShowingEditActions={false} existingLabelNames={[]} />,
                {
                    activeEventLabelId: 'label-1'
                }
            );

            const labelButton = screen.getByRole('button', { name: /Work/i });
            await user.click(labelButton);

            expect(mockSetActiveEventLabelId).toHaveBeenCalledWith(null);
        });
    });
});
