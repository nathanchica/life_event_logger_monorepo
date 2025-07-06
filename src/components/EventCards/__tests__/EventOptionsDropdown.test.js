import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EventOptionsDropdown from '../EventOptionsDropdown';

describe('EventOptionsDropdown', () => {
    const mockOnDismiss = jest.fn();
    const mockOnEditEventClick = jest.fn();
    const mockOnDeleteEventClick = jest.fn();

    const defaultProps = {
        onDismiss: mockOnDismiss,
        onEditEventClick: mockOnEditEventClick,
        onDeleteEventClick: mockOnDeleteEventClick
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders menu with correct structure and accessibility attributes', () => {
        render(<EventOptionsDropdown {...defaultProps} />);

        // Check menu structure
        const menu = screen.getByRole('menu', { name: 'Event options menu' });
        expect(menu).toBeInTheDocument();
        expect(menu).toHaveAttribute('aria-label', 'Event options menu');

        // Check menu items with text and accessibility
        const editMenuItem = screen.getByRole('menuitem', { name: 'Edit event' });
        const deleteMenuItem = screen.getByRole('menuitem', { name: 'Delete event' });

        expect(editMenuItem).toBeInTheDocument();
        expect(editMenuItem).toHaveAttribute('aria-label', 'Edit event');
        expect(deleteMenuItem).toBeInTheDocument();
        expect(deleteMenuItem).toHaveAttribute('aria-label', 'Delete event');

        expect(screen.getByText('Edit event')).toBeInTheDocument();
        expect(screen.getByText('Delete event')).toBeInTheDocument();
    });

    it.each([
        ['Edit event', mockOnEditEventClick],
        ['Delete event', mockOnDeleteEventClick]
    ])('calls correct callback when %s menu item is clicked', async (menuItemName, expectedCallback) => {
        render(<EventOptionsDropdown {...defaultProps} />);

        const menuItem = screen.getByRole('menuitem', { name: menuItemName });
        await userEvent.click(menuItem);

        expect(expectedCallback).toHaveBeenCalledTimes(1);
        expect(mockOnDismiss).not.toHaveBeenCalled();
    });
});
