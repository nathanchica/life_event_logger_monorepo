import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Sidebar from '../components/Sidebar';
import { ViewOptionsContext, AppTheme } from '../providers/ViewOptionsProvider';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';

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

const mockOnCollapseSidebarClick = jest.fn();
const mockEnableDarkTheme = jest.fn();
const mockEnableLightTheme = jest.fn();
const mockShowLoginView = jest.fn();
const mockHideLoginView = jest.fn();
const mockShowLoadingState = jest.fn();
const mockHideLoadingState = jest.fn();
const mockSetActiveEventLabelId = jest.fn();
const mockCreateLoggableEvent = jest.fn();
const mockUpdateLoggableEventDetails = jest.fn();
const mockDeleteLoggableEvent = jest.fn();
const mockLogEvent = jest.fn();
const mockDeleteEventTimestamp = jest.fn();
const mockCreateEventLabel = jest.fn();
const mockDeleteEventLabel = jest.fn();

const defaultProps = {
    isCollapsed: false,
    onCollapseSidebarClick: mockOnCollapseSidebarClick,
    isOfflineMode: false
};

const mockEventLabels = [
    { id: 'label-1', name: 'Work' },
    { id: 'label-2', name: 'Personal' },
    { id: 'label-3', name: 'Health' }
];

const createMockContext = (theme = AppTheme.Light) => ({
    theme,
    enableDarkTheme: mockEnableDarkTheme,
    enableLightTheme: mockEnableLightTheme,
    showLoginView: mockShowLoginView,
    hideLoginView: mockHideLoginView,
    loginViewIsShowing: false,
    showLoadingState: mockShowLoadingState,
    hideLoadingState: mockHideLoadingState,
    loadingStateIsShowing: false,
    activeEventLabelId: null,
    setActiveEventLabelId: mockSetActiveEventLabelId
});

function renderWithProviders(ui, options = {}) {
    const { theme = AppTheme.Light, eventLabels = [] } = options;
    const contextValue = createMockContext(theme);
    const muiTheme = createTheme({
        palette: {
            mode: theme === AppTheme.Dark ? 'dark' : 'light'
        }
    });

    const loggableEventsContextValue = {
        loggableEvents: [],
        eventLabels: eventLabels,
        createLoggableEvent: mockCreateLoggableEvent,
        updateLoggableEventDetails: mockUpdateLoggableEventDetails,
        deleteLoggableEvent: mockDeleteLoggableEvent,
        logEvent: mockLogEvent,
        deleteEventTimestamp: mockDeleteEventTimestamp,
        createEventLabel: mockCreateEventLabel,
        deleteEventLabel: mockDeleteEventLabel,
        offlineMode: false
    };

    return render(
        <ThemeProvider theme={muiTheme}>
            <LoggableEventsContext.Provider value={loggableEventsContextValue}>
                <ViewOptionsContext.Provider value={contextValue}>{ui}</ViewOptionsContext.Provider>
            </LoggableEventsContext.Provider>
        </ThemeProvider>
    );
}

describe('Sidebar', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

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
            [AppTheme.Light, 'Switch to dark mode', 'Brightness4Icon'],
            [AppTheme.Dark, 'Switch to light mode', 'Brightness7Icon']
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
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: AppTheme.Light });

            await userEvent.click(screen.getByLabelText('Switch to dark mode'));

            expect(mockEnableDarkTheme).toHaveBeenCalledTimes(1);
        });

        it('calls enableLightTheme when switching from dark to light', async () => {
            renderWithProviders(<Sidebar {...defaultProps} />, { theme: AppTheme.Dark });

            await userEvent.click(screen.getByLabelText('Switch to light mode'));

            expect(mockEnableLightTheme).toHaveBeenCalledTimes(1);
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

            // Verify we're in editing mode - should see edit icons for each label
            const editButtons = screen.getAllByLabelText('edit');
            expect(editButtons).toHaveLength(3); // One for each mock label

            const clickAwayTrigger = screen.getByTestId('click-away-trigger');
            await userEvent.click(clickAwayTrigger);

            await waitFor(() => {
                expect(screen.queryAllByLabelText('edit')).toHaveLength(0); // Edit icons should be removed
            });
        });
    });
});
