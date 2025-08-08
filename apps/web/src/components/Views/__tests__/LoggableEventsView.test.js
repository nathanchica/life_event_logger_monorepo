import { createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useMuiState from '../../../hooks/useMuiState';
import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import LoggableEventsView from '../LoggableEventsView';

jest.mock('../../../hooks/useMuiState');

// Mock child components
jest.mock('../../LoggableEvents/LoggableEventsList', () => {
    return function MockLoggableEventsList() {
        return <div data-testid="loggable-events-list">Loggable Events List</div>;
    };
});

jest.mock('../../EventCards/CreateEventCard', () => {
    return function MockCreateEventCard() {
        return <div data-testid="create-event-card">Create Event Card</div>;
    };
});

jest.mock('../../Sidebar/Sidebar', () => {
    return function MockSidebar({ isCollapsed, onCollapseSidebarClick }) {
        return (
            <div data-testid="sidebar">
                Sidebar
                {!isCollapsed && <button onClick={onCollapseSidebarClick}>Collapse</button>}
            </div>
        );
    };
});

describe('LoggableEventsView', () => {
    const renderWithProviders = (component, { viewOptionsContextValue = createMockViewOptionsContextValue() } = {}) => {
        return render(
            <ViewOptionsContext.Provider value={viewOptionsContextValue}>{component}</ViewOptionsContext.Provider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useMuiState.mockReturnValue({
            theme: createTheme(),
            isMobile: false,
            isDarkMode: false
        });
    });

    it.each([
        ['light', false],
        ['dark', true]
    ])('renders without errors in %s mode', (mode, isDarkMode) => {
        const muiTheme = createTheme({
            palette: {
                mode
            }
        });
        useMuiState.mockReturnValue({
            theme: muiTheme,
            isMobile: false,
            isDarkMode
        });

        renderWithProviders(<LoggableEventsView />);

        expect(screen.getByRole('application', { name: /life event logger application/i })).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByRole('main', { name: /loggable events main content/i })).toBeInTheDocument();
    });

    it('shows loading skeletons when isLoading is true', () => {
        renderWithProviders(<LoggableEventsView isLoading={true} />);

        // Check for skeleton elements
        const skeletons = screen.getAllByLabelText(/loading event card/i);
        expect(skeletons).toHaveLength(3);
    });

    it('shows normal content when not loading', () => {
        renderWithProviders(<LoggableEventsView isLoading={false} />);

        expect(screen.getByTestId('create-event-card')).toBeInTheDocument();
        expect(screen.getByTestId('loggable-events-list')).toBeInTheDocument();
    });

    it('shows error message when isShowingFetchError is true', () => {
        renderWithProviders(<LoggableEventsView isShowingFetchError={true} />);

        expect(screen.getByText('Sorry, something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Please try again later')).toBeInTheDocument();

        // Should not show create card or events list
        expect(screen.queryByTestId('create-event-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loggable-events-list')).not.toBeInTheDocument();
    });

    it('prioritizes error message over loading state', () => {
        renderWithProviders(<LoggableEventsView isLoading={true} isShowingFetchError={true} />);

        // Should show error message, not loading skeletons
        expect(screen.getByText('Sorry, something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Please try again later')).toBeInTheDocument();
        expect(screen.queryByLabelText(/loading event card/i)).not.toBeInTheDocument();
    });

    it.each([
        ['light', false],
        ['dark', true]
    ])('handles sidebar collapse and expand in desktop view with %s mode', async (mode, isDarkMode) => {
        const muiTheme = createTheme({
            palette: {
                mode
            }
        });
        useMuiState.mockReturnValue({
            theme: muiTheme,
            isMobile: false,
            isDarkMode
        });

        renderWithProviders(<LoggableEventsView />);

        // Desktop: sidebar should be expanded initially
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.queryByLabelText(/show sidebar/i)).not.toBeInTheDocument();

        // Click collapse button
        const collapseButton = screen.getByText('Collapse');
        await userEvent.click(collapseButton);

        // Show sidebar button should appear
        const showButton = screen.getByRole('button', { name: /show sidebar/i });
        expect(showButton).toBeInTheDocument();

        // Click to expand sidebar
        await userEvent.click(showButton);

        // Show button should disappear
        expect(screen.queryByLabelText(/show sidebar/i)).not.toBeInTheDocument();
    });

    it.each([
        ['light', false],
        ['dark', true]
    ])('starts with sidebar collapsed in mobile view with %s mode', (mode, isDarkMode) => {
        const muiTheme = createTheme({
            palette: {
                mode
            }
        });
        useMuiState.mockReturnValue({
            theme: muiTheme,
            isMobile: true,
            isDarkMode
        });

        renderWithProviders(<LoggableEventsView />);

        // Mobile: sidebar should be collapsed initially
        expect(screen.getByRole('button', { name: /show sidebar/i })).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});
