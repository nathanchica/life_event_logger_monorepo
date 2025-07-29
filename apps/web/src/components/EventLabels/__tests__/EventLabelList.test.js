import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CREATE_EVENT_LABEL_MUTATION } from '../../../hooks/useEventLabels';
import { createMockEventLabelFragment } from '../../../mocks/eventLabels';
import { createMutationResponse } from '../../../mocks/mutations';
import { createMockUserFragment } from '../../../mocks/user';
import { AuthContext } from '../../../providers/AuthProvider';
import ViewOptionsProvider from '../../../providers/ViewOptionsProvider';
import { MAX_LABEL_LENGTH } from '../../../utils/validation';
import EventLabelList from '../EventLabelList';

// Mock uuid to return a predictable value
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-value'
}));

describe('EventLabelList', () => {
    let apolloCache;
    let user;
    const mockUserFragment = createMockUserFragment();
    const mockAuthContextValue = {
        user: { id: mockUserFragment.id, email: mockUserFragment.email, name: mockUserFragment.name }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
        apolloCache = new InMemoryCache();
    });

    function renderWithProvidersAndMocks(ui, mocks) {
        return render(
            <MockedProvider mocks={mocks} cache={apolloCache}>
                <AuthContext.Provider value={mockAuthContextValue}>
                    <ViewOptionsProvider>{ui}</ViewOptionsProvider>
                </AuthContext.Provider>
            </MockedProvider>
        );
    }

    it('shows the label creation form when clicking create new label', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
    });

    it('disables check button if name is empty', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            const checkButton = screen.getByRole('button', { name: /Create label/i });
            expect(checkButton).toBeDisabled();
        });
    });

    it('shows error and disables check button for duplicate name', async () => {
        const existingLabel = createMockEventLabelFragment({
            id: 'existing-label',
            name: 'Work'
        });

        // prepopulate the cache with an existing label
        apolloCache.writeFragment({
            id: apolloCache.identify(mockUserFragment),
            fragment: EventLabelList.fragments.eventLabelsForUser,
            data: {
                __typename: 'User',
                eventLabels: [existingLabel]
            }
        });

        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);

        expect(await screen.findByText('Work')).toBeInTheDocument();

        // Try to create duplicate
        await user.click(await screen.findByText('Create new label'));
        expect(await screen.findByPlaceholderText('Label name')).toBeInTheDocument();

        const input = screen.getByPlaceholderText('Label name');
        await user.type(input, 'Work');
        expect(screen.getByText('Label already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create label/i })).toBeDisabled();
    });

    it('shows error and disables create for too long names', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const input = screen.getByPlaceholderText('Label name');
        await user.type(input, 'a'.repeat(MAX_LABEL_LENGTH + 1));
        expect(screen.getByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        const checkButton = screen.getByRole('button', { name: /Create label/i });
        expect(checkButton).toBeDisabled();
    });

    it('cancels label creation on cancel button', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        const cancelButton = screen.getByRole('button', { name: /Cancel label creation/ });
        await user.click(cancelButton);
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('cancels label creation on escape key', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        await user.keyboard('{Escape}');
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('creates a label when pressing Enter in the input', async () => {
        // prepopulate the cache with empty labels
        apolloCache.writeFragment({
            id: apolloCache.identify(mockUserFragment),
            fragment: EventLabelList.fragments.eventLabelsForUser,
            data: {
                __typename: 'User',
                eventLabels: []
            }
        });

        const labelToCreate = createMockEventLabelFragment({
            id: 'temp-mocked-uuid-value',
            name: 'New Label'
        });
        const mockCreateEventLabelMutationResponse = createMutationResponse({
            query: CREATE_EVENT_LABEL_MUTATION,
            input: {
                id: labelToCreate.id,
                name: labelToCreate.name
            },
            mutationName: 'createEventLabel',
            payload: {
                __typename: 'CreateEventLabelMutationPayload',
                tempID: labelToCreate.id,
                eventLabel: labelToCreate
            }
        });

        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />, [
            mockCreateEventLabelMutationResponse
        ]);
        await user.click(screen.getByText('Create new label'));
        expect(await screen.findByPlaceholderText('Label name')).toBeInTheDocument();
        await user.type(screen.getByPlaceholderText('Label name'), labelToCreate.name);
        await user.keyboard('{Enter}');
        expect(await screen.findByText(labelToCreate.name)).toBeInTheDocument();
        // The input should be removed after creation
        expect(screen.queryByPlaceholderText('Label name')).not.toBeInTheDocument();
    });

    it('does not create a label when pressing Enter on an empty form', async () => {
        renderWithProvidersAndMocks(<EventLabelList isShowingEditActions={false} />);
        await user.click(screen.getByText('Create new label'));
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
        });
        await user.keyboard('{Enter}');
        // The input should still be present
        expect(screen.getByPlaceholderText('Label name')).toBeInTheDocument();
    });
});
