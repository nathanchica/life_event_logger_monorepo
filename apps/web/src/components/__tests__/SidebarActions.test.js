import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useMuiState from '../../hooks/useMuiState';
import SidebarActions from '../SidebarActions';

jest.mock('../../hooks/useMuiState');

describe('SidebarActions', () => {
    let user;
    const mockOnToggleTheme = jest.fn();
    const mockOnToggleEditLabels = jest.fn();
    const mockOnLogout = jest.fn();

    beforeEach(() => {
        user = userEvent.setup();
        jest.clearAllMocks();
        useMuiState.mockReturnValue({ isDarkMode: false });
    });

    describe('list variant', () => {
        const renderComponent = (props = {}) => {
            return render(
                <SidebarActions
                    variant="list"
                    isEditingLabels={false}
                    onToggleTheme={mockOnToggleTheme}
                    onToggleEditLabels={mockOnToggleEditLabels}
                    onLogout={mockOnLogout}
                    {...props}
                />
            );
        };

        it('renders all action items as list items', () => {
            renderComponent();

            expect(screen.getByText('Switch to dark mode')).toBeInTheDocument();
            expect(screen.getByText('Manage labels')).toBeInTheDocument();
            expect(screen.getByText('View on GitHub')).toBeInTheDocument();
            expect(screen.getByText('Logout')).toBeInTheDocument();
        });

        it.each([
            ['theme toggle', 'Switch to dark mode', 'mockOnToggleTheme'],
            ['edit labels', 'Manage labels', 'mockOnToggleEditLabels'],
            ['logout', 'Logout', 'mockOnLogout']
        ])('handles %s click', async (_, buttonText, handlerName) => {
            renderComponent();
            const handlers = {
                mockOnToggleTheme,
                mockOnToggleEditLabels,
                mockOnLogout
            };

            await user.click(screen.getByText(buttonText));
            expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
        });

        it('renders GitHub link with correct href', () => {
            renderComponent();

            const githubLink = screen.getByText('View on GitHub').closest('a');
            expect(githubLink).toHaveAttribute('href', 'https://github.com/nathanchica/life_event_logger_monorepo');
            expect(githubLink).toHaveAttribute('target', '_blank');
            expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
        });

        it('shows correct theme text when dark mode is enabled', () => {
            useMuiState.mockReturnValue({ isDarkMode: true });
            renderComponent();

            expect(screen.getByText('Switch to light mode')).toBeInTheDocument();
            expect(screen.queryByText('Switch to dark mode')).not.toBeInTheDocument();
        });

        it('shows correct edit labels text when editing', () => {
            renderComponent({ isEditingLabels: true });

            expect(screen.getByText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByText('Manage labels')).not.toBeInTheDocument();
        });

        it('marks edit button as selected when editing labels', () => {
            renderComponent({ isEditingLabels: true });

            const editButton = screen.getByRole('button', { name: /stop editing labels/i });
            expect(editButton).toHaveClass('Mui-selected');
        });
    });

    describe('toolbar variant', () => {
        const renderComponent = (props = {}) => {
            return render(
                <SidebarActions
                    variant="toolbar"
                    isEditingLabels={false}
                    onToggleTheme={mockOnToggleTheme}
                    onToggleEditLabels={mockOnToggleEditLabels}
                    onLogout={mockOnLogout}
                    isCollapsed={false}
                    {...props}
                />
            );
        };

        it('renders all action items as icon buttons', () => {
            renderComponent();

            expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
            expect(screen.getByLabelText('View on GitHub')).toBeInTheDocument();
            expect(screen.getByLabelText('Logout')).toBeInTheDocument();
        });

        it.each([
            ['theme toggle', 'Switch to dark mode', 'mockOnToggleTheme'],
            ['edit labels', 'Manage labels', 'mockOnToggleEditLabels'],
            ['logout', 'Logout', 'mockOnLogout']
        ])('handles %s click', async (_, ariaLabel, handlerName) => {
            renderComponent();
            const handlers = {
                mockOnToggleTheme,
                mockOnToggleEditLabels,
                mockOnLogout
            };

            await user.click(screen.getByLabelText(ariaLabel));
            expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
        });

        it('renders GitHub link with correct href', () => {
            renderComponent();

            const githubLink = screen.getByLabelText('View on GitHub');
            expect(githubLink).toHaveAttribute('href', 'https://github.com/nathanchica/life_event_logger_monorepo');
            expect(githubLink).toHaveAttribute('target', '_blank');
            expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
        });

        it('shows correct theme aria-label when dark mode is enabled', () => {
            useMuiState.mockReturnValue({ isDarkMode: true });
            renderComponent();

            expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
            expect(screen.queryByLabelText('Switch to dark mode')).not.toBeInTheDocument();
        });

        it('shows correct edit labels aria-label when editing', () => {
            renderComponent({ isEditingLabels: true });

            expect(screen.getByLabelText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Manage labels')).not.toBeInTheDocument();
        });

        it('hides toolbar when sidebar is collapsed', () => {
            const { container } = renderComponent({ isCollapsed: true });

            const toolbar = container.querySelector('.MuiBox-root');
            expect(toolbar).toHaveStyle({ left: '-999px' });
        });

        it('shows toolbar when sidebar is not collapsed', () => {
            const { container } = renderComponent({ isCollapsed: false });

            const toolbar = container.querySelector('.MuiBox-root');
            expect(toolbar).toHaveStyle({ left: '8px' });
        });

        it('renders edit button as ToggleButton', () => {
            renderComponent({ isEditingLabels: true });

            const editButton = screen.getByLabelText('Stop editing labels');
            expect(editButton.classList.toString()).toMatch(/MuiToggleButton/);
            expect(editButton).toHaveAttribute('aria-pressed', 'true');
        });

        it('renders edit button as unselected when not editing', () => {
            renderComponent({ isEditingLabels: false });

            const editButton = screen.getByLabelText('Manage labels');
            expect(editButton).toHaveAttribute('aria-pressed', 'false');
        });
    });
});
