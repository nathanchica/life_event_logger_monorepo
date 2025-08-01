import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabel } from '../../mocks/eventLabels';
import { createMockViewOptionsContextValue, createMockAuthContextValue } from '../../mocks/providers';
import { AuthContext } from '../../providers/AuthProvider';
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

// Mock EventLabelList
jest.mock('../EventLabels/EventLabelList', () => {
    return function MockEventLabelList({ isShowingEditActions }) {
        return (
            <div data-testid="event-label-list">
                {isShowingEditActions && (
                    <>
                        <button aria-label="edit">Edit Label 1</button>
                        <button aria-label="edit">Edit Label 2</button>
                        <button aria-label="edit">Edit Label 3</button>
                    </>
                )}
            </div>
        );
    };
});

describe('Sidebar', () => {
    let user;
    const mockOnCollapseSidebarClick = jest.fn();
    const mockEnableDarkTheme = jest.fn();
    const mockEnableLightTheme = jest.fn();
    const mockSetActiveEventLabelId = jest.fn();
    const mockLogout = jest.fn();

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
        user = userEvent.setup();
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

        const mockAuthValue = createMockAuthContextValue({
            logout: mockLogout
        });

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <ThemeProvider theme={muiTheme}>
                <AuthContext.Provider value={mockAuthValue}>
                    <ViewOptionsContext.Provider value={mockViewOptionsValue}>{component}</ViewOptionsContext.Provider>
                </AuthContext.Provider>
            </ThemeProvider>
        );
    };

    describe('Rendering', () => {
        it('renders sidebar with title when not collapsed', () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText('View on GitHub')).toBeInTheDocument();
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
            expect(screen.getByLabelText('Logout')).toBeInTheDocument();
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

            await user.click(screen.getByLabelText('Hide sidebar'));

            expect(mockOnCollapseSidebarClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Theme Toggle', () => {
        it('calls enableDarkTheme when switching from light to dark', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'light' });

            await user.click(screen.getByLabelText('Switch to dark mode'));

            expect(mockEnableDarkTheme).toHaveBeenCalledTimes(1);
        });

        it('calls enableLightTheme when switching from dark to light', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'dark' });

            await user.click(screen.getByLabelText('Switch to light mode'));

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
            await user.click(manageButton);

            // Should now show "Stop editing labels"
            expect(screen.getByLabelText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Manage labels')).not.toBeInTheDocument();

            // Click again to exit edit mode
            await user.click(screen.getByLabelText('Stop editing labels'));

            // Should be back to "Manage labels"
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Stop editing labels')).not.toBeInTheDocument();
        });

        it('exits editing mode when clicking away', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { eventLabels: mockEventLabels });

            // Enter editing mode
            const manageButton = screen.getByLabelText('Manage labels');
            await user.click(manageButton);

            // Verify button changed to "Stop editing labels"
            expect(screen.getByLabelText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Manage labels')).not.toBeInTheDocument();

            // Verify we're in editing mode - should see edit icons for each label
            const editButtons = screen.getAllByLabelText('edit');
            expect(editButtons).toHaveLength(3); // One for each mock label

            const clickAwayTrigger = screen.getByTestId('click-away-trigger');
            await user.click(clickAwayTrigger);

            // Verify edit buttons are removed and state has changed
            expect(screen.queryAllByLabelText('edit')).toHaveLength(0); // Edit icons should be removed
            expect(screen.getByLabelText('Manage labels')).toBeInTheDocument();
            expect(screen.queryByLabelText('Stop editing labels')).not.toBeInTheDocument();
        });
    });

    describe('Logout Functionality', () => {
        it('calls logout when logout button is clicked', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />);

            await user.click(screen.getByLabelText('Logout'));

            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });
});
