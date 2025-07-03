import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import LoggableEventsView from '../components/LoggableEventsView';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';
import { ComponentDisplayContext } from '../providers/ComponentDisplayProvider';

describe('LoggableEventsView', () => {
    const mockEventLabels = [
        { id: 'label-1', name: 'Work' },
        { id: 'label-2', name: 'Personal' }
    ];

    const mockLoggableEvents = [
        {
            id: 'event-1',
            name: 'Test Event 1',
            timestamps: [],
            warningThresholdInDays: 7,
            labelIds: ['label-1']
        },
        {
            id: 'event-2',
            name: 'Test Event 2',
            timestamps: [],
            warningThresholdInDays: 7,
            labelIds: ['label-2']
        },
        {
            id: 'event-3',
            name: 'Event with null labels',
            timestamps: [],
            warningThresholdInDays: 7,
            labelIds: null
        }
    ];

    const defaultLoggableEventsContextValues = {
        loggableEvents: mockLoggableEvents,
        eventLabels: mockEventLabels,
        dataIsLoaded: true,
        createLoggableEvent: jest.fn(),
        updateLoggableEventDetails: jest.fn(),
        deleteLoggableEvent: jest.fn(),
        logEvent: jest.fn(),
        deleteEventTimestamp: jest.fn(),
        createEventLabel: jest.fn(),
        deleteEventLabel: jest.fn()
    };

    const defaultComponentDisplayContextValues = {
        activeEventLabelId: null,
        loadingStateIsShowing: false,
        theme: 'light',
        showLoadingState: jest.fn(),
        hideLoadingState: jest.fn(),
        setActiveEventLabelId: jest.fn(),
        enableDarkTheme: jest.fn(),
        enableLightTheme: jest.fn()
    };

    function renderWithProvider(ui, options = {}) {
        const { loggableEventsContextValues = {}, componentDisplayContextValues = {}, theme = 'light' } = options;

        const mockLoggableEventsContextValue = {
            ...defaultLoggableEventsContextValues,
            ...loggableEventsContextValues
        };

        const mockComponentDisplayContextValue = {
            ...defaultComponentDisplayContextValues,
            ...componentDisplayContextValues
        };

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <MockedProvider mocks={[]} addTypename={false}>
                <ThemeProvider theme={muiTheme}>
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                        <LoggableEventsContext.Provider value={mockLoggableEventsContextValue}>
                            <ComponentDisplayContext.Provider value={mockComponentDisplayContextValue}>
                                {ui}
                            </ComponentDisplayContext.Provider>
                        </LoggableEventsContext.Provider>
                    </LocalizationProvider>
                </ThemeProvider>
            </MockedProvider>
        );
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['light', 'light'],
        ['dark', 'dark']
    ])('renders', (_, themeMode) => {
        renderWithProvider(<LoggableEventsView offlineMode={true} />, { theme: themeMode });

        // Should show sidebar title
        expect(screen.getByText('Event Log (Offline mode)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
        mockLoggableEvents.forEach((event) => {
            expect(screen.getByRole('heading', { name: event.name })).toBeInTheDocument();
        });
    });

    it('shows loading state when data is not loaded', () => {
        renderWithProvider(<LoggableEventsView offlineMode={true} />, {
            loggableEventsContextValues: { dataIsLoaded: false },
            componentDisplayContextValues: { loadingStateIsShowing: true }
        });

        expect(screen.getAllByLabelText('Loading event card')).toHaveLength(3);
    });

    it('filters events when activeEventLabelId is set', () => {
        renderWithProvider(<LoggableEventsView offlineMode={true} />, {
            componentDisplayContextValues: { activeEventLabelId: 'label-1' }
        });

        expect(screen.getByRole('heading', { name: 'Test Event 1' })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Test Event 2' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Event with null labels' })).not.toBeInTheDocument();
    });

    it('handles no loggable events', () => {
        renderWithProvider(<LoggableEventsView offlineMode={true} />, {
            loggableEventsContextValues: { loggableEvents: [] }
        });

        expect(screen.getByText('Event Log (Offline mode)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
    });

    describe('Sidebar behavior', () => {
        it('shows sidebar collapsed button (Hide sidebar) when expanded', () => {
            renderWithProvider(<LoggableEventsView offlineMode={true} />);

            // When sidebar is expanded, should show the collapse button
            expect(screen.getByLabelText('Hide sidebar')).toBeInTheDocument();

            // When sidebar is expanded, the expand button should not be visible
            expect(screen.queryByLabelText('Show sidebar')).not.toBeInTheDocument();
        });

        it.each([['light'], ['dark']])('shows expand button when sidebar is collapsed', async (themeMode) => {
            renderWithProvider(<LoggableEventsView offlineMode={true} />, { theme: themeMode });

            // Click the collapse button to collapse sidebar
            const collapseButton = screen.getByLabelText('Hide sidebar');
            await userEvent.click(collapseButton);

            // After collapsing, should show the expand button
            expect(screen.getByLabelText('Show sidebar')).toBeInTheDocument();
        });
    });
});
