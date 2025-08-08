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
    return function MockLoggableEventsList({ searchTerm }) {
        return (
            <div data-testid="loggable-events-list">
                Loggable Events List
                {searchTerm && <div data-testid="search-term">Search: {searchTerm}</div>}
            </div>
        );
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

    describe('Mobile sidebar expanded state', () => {
        let user;

        beforeEach(() => {
            user = userEvent.setup();
            const muiTheme = createTheme({
                palette: {
                    mode: 'light'
                },
                zIndex: {
                    drawer: 1200
                }
            });
            useMuiState.mockReturnValue({
                theme: muiTheme,
                isMobile: true,
                isDarkMode: false
            });
        });

        it('can expand and collapse sidebar on mobile', async () => {
            renderWithProviders(<LoggableEventsView />);

            // Initially show button is visible (sidebar collapsed)
            const showButton = screen.getByRole('button', { name: /show sidebar/i });
            expect(showButton).toBeInTheDocument();

            // Click to expand
            await user.click(showButton);

            // Show button should disappear when sidebar is expanded
            expect(screen.queryByRole('button', { name: /show sidebar/i })).not.toBeInTheDocument();

            // Collapse button should be available
            const collapseButton = screen.getByText('Collapse');
            expect(collapseButton).toBeInTheDocument();

            // Click to collapse
            await user.click(collapseButton);

            // Show button should reappear
            expect(screen.getByRole('button', { name: /show sidebar/i })).toBeInTheDocument();
        });

        it('renders sidebar and main content on mobile', () => {
            renderWithProviders(<LoggableEventsView />);

            // Both sidebar and main content should be present
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
            expect(screen.getByRole('main', { name: /loggable events main content/i })).toBeInTheDocument();
        });

        it('maintains content visibility when sidebar is expanded', async () => {
            renderWithProviders(<LoggableEventsView />);

            // Expand sidebar
            const showButton = screen.getByRole('button', { name: /show sidebar/i });
            await user.click(showButton);

            // Both sidebar and main content should still be in the DOM
            expect(screen.getByTestId('sidebar')).toBeInTheDocument();
            expect(screen.getByRole('main', { name: /loggable events main content/i })).toBeInTheDocument();
        });
    });

    describe('Search functionality', () => {
        let user;

        beforeEach(() => {
            user = userEvent.setup();
        });

        it.each([
            ['light mode', false],
            ['dark mode', true]
        ])('renders search bar when not loading or showing error in %s', (_, isDarkMode) => {
            useMuiState.mockReturnValue({
                theme: createTheme({ palette: { mode: isDarkMode ? 'dark' : 'light' } }),
                isMobile: false,
                isDarkMode
            });

            renderWithProviders(<LoggableEventsView />);

            const searchInput = screen.getByLabelText(/search events/i);
            expect(searchInput).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
        });

        it('does not render search bar when loading', () => {
            renderWithProviders(<LoggableEventsView isLoading={true} />);

            expect(screen.queryByLabelText(/search events/i)).not.toBeInTheDocument();
        });

        it('does not render search bar when showing error', () => {
            renderWithProviders(<LoggableEventsView isShowingFetchError={true} />);

            expect(screen.queryByLabelText(/search events/i)).not.toBeInTheDocument();
        });

        it('passes search term to LoggableEventsList when typing', async () => {
            renderWithProviders(<LoggableEventsView />);

            const searchInput = screen.getByPlaceholderText('Search events...');

            // Initially no search term should be displayed
            expect(screen.queryByText(/Search:/)).not.toBeInTheDocument();

            // Type in the search input
            await user.type(searchInput, 'doctor');

            // Check that the search term is passed to LoggableEventsList
            expect(screen.getByText('Search: doctor')).toBeInTheDocument();
            expect(searchInput).toHaveValue('doctor');
        });

        it('updates search term as user types', async () => {
            renderWithProviders(<LoggableEventsView />);

            const searchInput = screen.getByPlaceholderText('Search events...');

            // Type first search term
            await user.type(searchInput, 'test');
            expect(screen.getByText('Search: test')).toBeInTheDocument();

            // Clear and type new search term
            await user.clear(searchInput);
            await user.type(searchInput, 'appointment');
            expect(screen.getByText('Search: appointment')).toBeInTheDocument();
        });
    });
});
