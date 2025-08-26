import { useState } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import EventOptionsDropdown from '../EventOptionsDropdown';

describe('EventOptionsDropdown', () => {
    let user;
    const mockOnDismiss = vi.fn();
    const mockOnEditEventClick = vi.fn();
    const mockOnDeleteEventClick = vi.fn();

    const defaultProps = {
        onDismiss: mockOnDismiss,
        onEditEventClick: mockOnEditEventClick,
        onDeleteEventClick: mockOnDeleteEventClick
    };

    beforeEach(() => {
        user = userEvent.setup();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it.each(['light', 'dark'])('renders menu in %s mode', (mode) => {
        render(
            <ThemeProvider theme={createTheme({ palette: { mode } })}>
                <EventOptionsDropdown {...defaultProps} />
            </ThemeProvider>
        );

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
        await user.click(menuItem);

        expect(expectedCallback).toHaveBeenCalledTimes(1);
        expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    describe('viewport-aware positioning', () => {
        const originalInnerWidth = window.innerWidth;

        afterEach(() => {
            // Restore original window width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalInnerWidth
            });
        });

        // Test wrapper component with positioned parent and visibility control
        const DropdownWrapper = ({ leftPosition, initialVisible = true, ...props }) => {
            const [isVisible, setIsVisible] = useState(initialVisible);

            return (
                <div
                    style={{ position: 'relative', left: leftPosition }}
                    ref={(el) => {
                        if (el) {
                            // Mock getBoundingClientRect for this specific element
                            el.getBoundingClientRect = () => ({
                                left: leftPosition,
                                right: leftPosition + 100,
                                top: 0,
                                bottom: 40,
                                width: 100,
                                height: 40
                            });
                        }
                    }}
                >
                    <button onClick={() => setIsVisible(!isVisible)} data-testid="toggle-dropdown">
                        Toggle
                    </button>
                    {isVisible && <EventOptionsDropdown {...props} />}
                </div>
            );
        };

        it('renders dropdown left-aligned when there is enough space', () => {
            // Set a wide viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1200
            });

            render(<DropdownWrapper leftPosition={100} {...defaultProps} />);

            const menu = screen.getByRole('menu', { name: 'Event options menu' });
            expect(menu).toBeInTheDocument();
        });

        it('renders dropdown right-aligned when it would overflow viewport', () => {
            // Set a narrow viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 400
            });

            // Position near right edge (250 + 200 dropdown width = 450 > 400 viewport)
            render(<DropdownWrapper leftPosition={250} {...defaultProps} />);

            const menu = screen.getByRole('menu', { name: 'Event options menu' });
            expect(menu).toBeVisible();
        });

        it('calculates position when dropdown becomes visible', async () => {
            // Set viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600
            });

            // Start with dropdown hidden
            render(<DropdownWrapper leftPosition={450} initialVisible={false} {...defaultProps} />);

            // Dropdown should not be in document initially
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();

            // Toggle to show dropdown
            const toggleButton = screen.getByTestId('toggle-dropdown');
            await user.click(toggleButton);

            // Now dropdown should be visible
            const menu = screen.getByRole('menu', { name: 'Event options menu' });
            expect(menu).toBeVisible();

            // Toggle to hide dropdown
            await user.click(screen.getByTestId('toggle-dropdown'));
        });
    });
});
