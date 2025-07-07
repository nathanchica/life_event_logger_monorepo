import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabel } from '../../mocks/eventLabels';
import { createMockViewOptionsContextValue } from '../../mocks/providers';
import { ViewOptionsContext } from '../../providers/ViewOptionsProvider';
import Sidebar from '../Sidebar';

// Mock ClickAwayListener
jest.mock('@mui/material/ClickAwayListener', () => {
    return function MockClickAwayListener({ children, onClickAway }) {
        return (
            <>
                <button onClick={onClickAway} data-testid="click-away-trigger">
                    Click Away
                </button>
                {children}
            </>
        );
    };
});

describe('Sidebar', () => {
    const mockOnCollapseSidebarClick = jest.fn();
    const mockEnableDarkTheme = jest.fn();
    const mockEnableLightTheme = jest.fn();
    const mockSetActiveEventLabelId = jest.fn();

    const defaultProps = {
        isCollapsed: false,
        onCollapseSidebarClick: mockOnCollapseSidebarClick,
        isOfflineMode: false
    };

    const mockEventLabels = [
        createMockEventLabel({ id: 'label-1', name: 'Work' }),
        createMockEventLabel({ id: 'label-2', name: 'Personal' }),
        createMockEventLabel({ id: 'label-3', name: 'Health' })
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (component, options = {}) => {
        const { theme = 'light' } = options;

        const mockViewOptionsValue = createMockViewOptionsContextValue({
            theme,
            enableDarkTheme: mockEnableDarkTheme,
            enableLightTheme: mockEnableLightTheme,
            setActiveEventLabelId: mockSetActiveEventLabelId
        });

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <ThemeProvider theme={muiTheme}>
                <ViewOptionsContext.Provider value={mockViewOptionsValue}>{component}</ViewOptionsContext.Provider>
            </ThemeProvider>
        );
    };

    describe('Rendering', () => {
        it('renders sidebar with title when not collapsed', () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText('View on GitHub')).toBeInTheDocument();
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
        });

        it('renders sidebar in offline mode', () => {
            renderWithProviders(<Sidebar {...defaultProps} isOfflineMode={true} />);

            expect(screen.getByText('Event Log (Offline mode)')).toBeInTheDocument();
        });

        it.each([
            ['light', 'Switch to dark mode', 'Brightness4Icon'],
            ['dark', 'Switch to light mode', 'Brightness7Icon']
        ])('renders sidebar in %s mode with correct theme elements', (theme, buttonLabel, iconTestId) => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme });

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText(buttonLabel)).toBeInTheDocument();
            expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
        });
    });

    describe('Collapse/Expand Behavior', () => {
        it('shows content when not collapsed', () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText('Hide sidebar')).toBeInTheDocument();
        });

        it('hides content when collapsed', () => {
            renderWithProviders(<Sidebar {...defaultProps} isCollapsed={true} />);

            expect(screen.queryByText('Event Log')).not.toBeVisible();
            expect(screen.queryByLabelText('Hide sidebar')).not.toBeVisible();
        });

        it('calls onCollapseSidebarClick when hide button is clicked', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            await userEvent.click(screen.getByLabelText('Hide sidebar'));

            expect(mockOnCollapseSidebarClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Theme Toggle', () => {
        it('calls enableDarkTheme when switching from light to dark', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'light' });

            await userEvent.click(screen.getByLabelText('Switch to dark mode'));

            expect(mockEnableDarkTheme).toHaveBeenCalledTimes(1);
        });

        it('calls enableLightTheme when switching from dark to light', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'dark' });

            await userEvent.click(screen.getByLabelText('Switch to light mode'));

            expect(mockEnableLightTheme).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edit Labels Toggle', () => {
        it('toggles between edit and non-edit mode', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { eventLabels: mockEventLabels });

            // Initially should show "Manage labels"
            const manageButton = screen.getByLabelText('Manage labels');
            expect(manageButton).toBeInTheDocument();

            // Click to enter edit mode
            await userEvent.click(manageButton);

            // Should now show "Stop editing labels"
            expect(screen.getByLabelText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Manage labels')).not.toBeInTheDocument();

            // Click again to exit edit mode
            await userEvent.click(screen.getByLabelText('Stop editing labels'));

            // Should be back to "Manage labels"
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Stop editing labels')).not.toBeInTheDocument();
        });
    });

    describe('Click Away Behavior', () => {
        it('handles click away', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            const clickAwayTrigger = screen.getByTestId('click-away-trigger');
            await userEvent.click(clickAwayTrigger);

            expect(screen.getByText('Event Log')).toBeInTheDocument();
        });

        it('shows edit icons when in editing mode with event labels', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { eventLabels: mockEventLabels });

            // Enter editing mode
            const manageButton = screen.getByLabelText('Manage labels');
            await userEvent.click(manageButton);

            // Verify button changed to "Stop editing labels"
            expect(screen.getByLabelText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Manage labels')).not.toBeInTheDocument();

            // Verify we're in editing mode - should see edit icons for each label
            const editButtons = screen.getAllByLabelText('edit');
            expect(editButtons).toHaveLength(3); // One for each mock label

            const clickAwayTrigger = screen.getByTestId('click-away-trigger');
            await userEvent.click(clickAwayTrigger);

            await waitFor(() => {
                expect(screen.queryAllByLabelText('edit')).toHaveLength(0); // Edit icons should be removed
                expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
                expect(screen.queryByLabelText('Stop editing labels')).not.toBeInTheDocument();
            });
        });
    });
});
