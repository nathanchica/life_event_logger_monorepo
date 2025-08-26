import { createTheme } from '@mui/material/styles';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import useMuiState from '../../../hooks/useMuiState';
import EventCardHeader from '../EventCardHeader';

vi.mock('../../../hooks/useMuiState');

describe('EventCardHeader', () => {
    let user;
    const mockOnEditEvent = vi.fn();
    const mockOnDeleteEvent = vi.fn();

    const defaultProps = {
        eventId: 'event-123',
        name: 'Test Event',
        onEditEvent: mockOnEditEvent,
        onDeleteEvent: mockOnDeleteEvent
    };

    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();
        useMuiState.mockReturnValue({
            theme: createTheme(),
            isMobile: false,
            isDarkMode: false
        });
    });

    it('renders in desktop view', () => {
        useMuiState.mockReturnValue({
            theme: createTheme(),
            isMobile: false,
            isDarkMode: false
        });

        render(<EventCardHeader {...defaultProps} />);

        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Event options for Test Event' })).toBeInTheDocument();
    });

    it('renders in mobile view', () => {
        useMuiState.mockReturnValue({
            theme: createTheme(),
            isMobile: true,
            isDarkMode: false
        });

        render(<EventCardHeader {...defaultProps} />);

        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Event options for Test Event' })).toBeInTheDocument();
    });

    it('shows dropdown when options button is clicked', async () => {
        render(<EventCardHeader {...defaultProps} />);

        const optionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
        await user.click(optionsButton);

        expect(screen.getByRole('menu', { name: 'Event options menu' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Edit event' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Delete event' })).toBeInTheDocument();
    });

    it('hides dropdown when clicking away', async () => {
        render(<EventCardHeader {...defaultProps} />);

        const optionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
        await user.click(optionsButton);

        expect(screen.getByRole('menu')).toBeInTheDocument();

        // Click outside the dropdown
        user.click(document.body);

        await waitForElementToBeRemoved(() => screen.queryByRole('menu'));
    });

    it('calls onEditEvent and hides dropdown when edit is clicked', async () => {
        render(<EventCardHeader {...defaultProps} />);

        const optionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
        await user.click(optionsButton);

        const editButton = screen.getByRole('menuitem', { name: 'Edit event' });
        await user.click(editButton);

        expect(mockOnEditEvent).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('calls onDeleteEvent and hides dropdown when delete is clicked', async () => {
        render(<EventCardHeader {...defaultProps} />);

        const optionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });
        await user.click(optionsButton);

        const deleteButton = screen.getByRole('menuitem', { name: 'Delete event' });
        await user.click(deleteButton);

        expect(mockOnDeleteEvent).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it.each([
        ['short name', 'A'],
        ['long name', 'This is a very long event name that should still render properly'],
        ['special characters', 'Event with @#$%^&*() special chars!']
    ])('renders correctly with %s', (_, eventName) => {
        render(<EventCardHeader {...defaultProps} name={eventName} />);

        expect(screen.getByText(eventName)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `Event options for ${eventName}` })).toBeInTheDocument();
    });

    it('handles multiple dropdown interactions', async () => {
        render(<EventCardHeader {...defaultProps} />);

        const optionsButton = screen.getByRole('button', { name: 'Event options for Test Event' });

        // Open dropdown
        await user.click(optionsButton);
        expect(screen.getByRole('menu')).toBeInTheDocument();

        // Close by clicking outside
        user.click(document.body);
        await waitForElementToBeRemoved(() => screen.queryByRole('menu'));

        // Open again
        await user.click(optionsButton);
        expect(screen.getByRole('menu')).toBeInTheDocument();

        // Close by clicking edit
        await user.click(screen.getByRole('menuitem', { name: 'Edit event' }));
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(mockOnEditEvent).toHaveBeenCalledTimes(1);
    });
});
