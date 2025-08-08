import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useMuiState from '../../hooks/useMuiState';
import { createMockEventLabel } from '../../mocks/eventLabels';
import { createMockViewOptionsContextValue, createMockAuthContextValue } from '../../mocks/providers';
import { AuthContext } from '../../providers/AuthProvider';
import { ViewOptionsContext } from '../../providers/ViewOptionsProvider';
import Sidebar from '../Sidebar';

jest.mock('../../hooks/useMuiState');

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

// Mock useAuthMutations hook
const mockLogoutMutation = jest.fn();
jest.mock('../../hooks/useAuthMutations', () => ({
    useAuthMutations: () => ({
        logoutMutation: mockLogoutMutation
    })
}));

describe('Sidebar', () => {
    let user;
    const mockOnCollapseSidebarClick = jest.fn();
    const mockEnableDarkTheme = jest.fn();
    const mockEnableLightTheme = jest.fn();
    const mockSetActiveEventLabelId = jest.fn();
    const mockClearAuthData = jest.fn();

    const defaultProps = {
        isCollapsed: false,
        isLoading: false,
        onCollapseSidebarClick: mockOnCollapseSidebarClick
    };

    const mockEventLabels = [
        createMockEventLabel({ id: 'label-1', name: 'Work' }),
        createMockEventLabel({ id: 'label-2', name: 'Personal' }),
        createMockEventLabel({ id: 'label-3', name: 'Health' })
    ];

    beforeEach(() => {
        user = userEvent.setup();
        jest.clearAllMocks();
        // Default to successful logout
        mockLogoutMutation.mockResolvedValue({});
        // Default mock for useMuiState
        useMuiState.mockReturnValue({
            isMobile: false,
            isDarkMode: false
        });
    });

    const renderWithProviders = (component, options = {}) => {
        const { theme = 'light', authValueOptions = {} } = options;

        const mockViewOptionsValue = createMockViewOptionsContextValue({
            theme,
            enableDarkTheme: mockEnableDarkTheme,
            enableLightTheme: mockEnableLightTheme,
            setActiveEventLabelId: mockSetActiveEventLabelId
        });

        const mockAuthValue = createMockAuthContextValue({
            clearAuthData: mockClearAuthData,
            ...authValueOptions
        });

        return render(
            <AuthContext.Provider value={mockAuthValue}>
                <ViewOptionsContext.Provider value={mockViewOptionsValue}>{component}</ViewOptionsContext.Provider>
            </AuthContext.Provider>
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
            renderWithProviders(<Sidebar {...defaultProps} />, { authValueOptions: { isOfflineMode: true } });

            expect(screen.getByText('Event Log (Offline mode)')).toBeInTheDocument();
        });

        it('renders loading state with shimmer components', () => {
            renderWithProviders(<Sidebar {...defaultProps} isLoading={true} />);

            const shimmers = screen.getAllByLabelText('Loading event label');
            expect(shimmers).toHaveLength(3);
            expect(screen.queryByTestId('event-label-list')).not.toBeInTheDocument();
        });

        it('renders event label list when not loading', () => {
            renderWithProviders(<Sidebar {...defaultProps} isLoading={false} />);

            expect(screen.getByTestId('event-label-list')).toBeInTheDocument();
            expect(screen.queryByLabelText('Loading event label')).not.toBeInTheDocument();
        });

        it.each([
            ['light', 'Switch to dark mode', 'Brightness4Icon', false],
            ['dark', 'Switch to light mode', 'Brightness7Icon', true]
        ])('renders sidebar in %s mode with correct theme elements', (mode, buttonLabel, iconTestId, isDarkMode) => {
            useMuiState.mockReturnValue({
                isMobile: false,
                isDarkMode
            });

            renderWithProviders(<Sidebar {...defaultProps} />, { theme: mode });

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText(buttonLabel)).toBeInTheDocument();
            expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
        });
    });

    describe('Collapse/Expand Behavior', () => {
        it.each([
            ['desktop', false],
            ['mobile', true]
        ])('shows content when not collapsed in %s view', (_, isMobile) => {
            useMuiState.mockReturnValue({
                isMobile,
                isDarkMode: false
            });

            renderWithProviders(<Sidebar {...defaultProps} />);

            expect(screen.getByText('Event Log')).toBeInTheDocument();
            expect(screen.getByLabelText('Hide sidebar')).toBeInTheDocument();
        });

        it.each([
            ['desktop', false],
            ['mobile', true]
        ])('hides content when collapsed in %s view', (_, isMobile) => {
            useMuiState.mockReturnValue({
                isMobile,
                isDarkMode: false
            });

            renderWithProviders(<Sidebar {...defaultProps} isCollapsed={true} />);

            expect(screen.queryByText('Event Log')).not.toBeVisible();
            expect(screen.queryByLabelText('Hide sidebar')).not.toBeVisible();
        });

        it.each([
            ['desktop', false],
            ['mobile', true]
        ])('calls onCollapseSidebarClick when hide button is clicked in %s view', async (_, isMobile) => {
            useMuiState.mockReturnValue({
                isMobile,
                isDarkMode: false
            });

            renderWithProviders(<Sidebar {...defaultProps} />);

            await user.click(screen.getByLabelText('Hide sidebar'));

            expect(mockOnCollapseSidebarClick).toHaveBeenCalledTimes(1);
        });
    });

    describe('Theme Toggle', () => {
        it('calls enableDarkTheme when switching from light to dark', async () => {
            useMuiState.mockReturnValue({
                isMobile: false,
                isDarkMode: false
            });

            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'light' });

            await user.click(screen.getByLabelText('Switch to dark mode'));

            expect(mockEnableDarkTheme).toHaveBeenCalledTimes(1);
        });

        it('calls enableLightTheme when switching from dark to light', async () => {
            useMuiState.mockReturnValue({
                isMobile: false,
                isDarkMode: true
            });

            renderWithProviders(<Sidebar {...defaultProps} />, { theme: 'dark' });

            await user.click(screen.getByLabelText('Switch to light mode'));

            expect(mockEnableLightTheme).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edit Labels Toggle', () => {
        it('toggles between edit and non-edit mode in desktop view', async () => {
            useMuiState.mockReturnValue({
                isMobile: false,
                isDarkMode: false
            });
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

        it('toggles between edit and non-edit mode in mobile view', async () => {
            useMuiState.mockReturnValue({
                isMobile: true,
                isDarkMode: false
            });
            renderWithProviders(<Sidebar {...defaultProps} />, { eventLabels: mockEventLabels });

            // Initially should show "Manage labels" as text in list item
            const manageButton = screen.getByText('Manage labels');
            expect(manageButton).toBeInTheDocument();

            // Click to enter edit mode
            await user.click(manageButton);

            // Should now show "Stop editing labels" as text
            expect(screen.getByText('Stop editing labels')).toBeInTheDocument();
            expect(screen.queryByText('Manage labels')).not.toBeInTheDocument();

            // Click again to exit edit mode
            await user.click(screen.getByText('Stop editing labels'));

            // Should be back to "Manage labels"
            expect(screen.getByText('Manage labels')).toBeInTheDocument();
            expect(screen.queryByText('Stop editing labels')).not.toBeInTheDocument();
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
        it.each([
            { scenario: 'online mode', isOfflineMode: false },
            { scenario: 'offline mode', isOfflineMode: true }
        ])(
            'calls logoutMutation and clearAuthData when logout button is clicked in $scenario',
            async ({ isOfflineMode }) => {
                renderWithProviders(<Sidebar {...defaultProps} />, { authValueOptions: { isOfflineMode } });

                await user.click(screen.getByLabelText('Logout'));

                expect(mockLogoutMutation).toHaveBeenCalledTimes(isOfflineMode ? 0 : 1);
                expect(mockClearAuthData).toHaveBeenCalledTimes(1);
            }
        );

        it('handles logout mutation error gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            mockLogoutMutation.mockRejectedValue(new Error('Logout failed'));
            renderWithProviders(<Sidebar {...defaultProps} />);

            await user.click(screen.getByLabelText('Logout'));

            // Should still call clearAuthData even if mutation fails
            expect(mockLogoutMutation).toHaveBeenCalledTimes(1);
            expect(mockClearAuthData).toHaveBeenCalledTimes(1);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });
});
