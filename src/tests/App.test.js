import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';

import App from '../App';
import { MAX_LENGTH } from '../components/EventCards/EditEventCard';
import { GET_USERS_EVENTS_AND_LABELS_QUERY_MOCK_EMPTY } from '../mocks/useLoggableEventsApiMocks';

/**
 * Mock system time to mock new Date() value
 */
jest.useFakeTimers().setSystemTime(new Date('2020-05-10'));

const EVENT_NAME = 'get haircut';

const registerLoggableEvent = async () => {
    userEvent.click(screen.getByLabelText('Add event'));
    await userEvent.type(screen.getByLabelText('Event name'), EVENT_NAME);
    userEvent.click(screen.getByRole('button', { name: 'Create' }));
};

const customRender = (content) => {
    return render(
        <MockedProvider mocks={GET_USERS_EVENTS_AND_LABELS_QUERY_MOCK_EMPTY} addTypename={false}>
            {content}
        </MockedProvider>
    );
};

let originalLocation;

beforeEach(() => {
    // Set the URL to include the 'offline' search param
    originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, search: '?offline' };
});

afterEach(() => {
    window.location = originalLocation;
});

it('renders in offline mode', () => {
    customRender(<App />);
    expect(screen.getByText(/Offline mode/)).toBeInTheDocument();
    expect(screen.getByLabelText('Add event')).toBeInTheDocument();
});

it('handles loggable event creation', async () => {
    customRender(<App />);

    expect(await screen.findByLabelText('Add event')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();

    await registerLoggableEvent();

    expect(await screen.findByRole('heading', { name: 'get haircut' })).toBeInTheDocument();
});

it('handles logging an event', async () => {
    customRender(<App />);
    await registerLoggableEvent();

    expect(await screen.findByRole('heading', { name: 'get haircut' })).toBeInTheDocument();
    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Log Today' }));

    expect(screen.getByText(/2020/)).toBeInTheDocument();
});

it('validates event name length', async () => {
    customRender(<App />);

    expect(screen.queryByText(/Event name is too long/)).not.toBeInTheDocument();

    userEvent.click(screen.getByLabelText('Add event'));
    await userEvent.type(screen.getByLabelText('Event name'), 'a'.repeat(MAX_LENGTH + 1));

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    expect(screen.getByText(/Event name is too long/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();
});

it('handles empty event name input', async () => {
    customRender(<App />);

    await userEvent.click(screen.getByLabelText('Add event'));

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('button', { name: 'Create' }));

    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();
});

it('toggles between light mode and dark mode', async () => {
    customRender(<App />);
    await registerLoggableEvent();

    // Should start in light mode, so button label is 'Switch to dark mode'
    let toggleButton = await screen.findByRole('button', { name: /switch to dark mode/i });
    expect(toggleButton).toBeInTheDocument();

    // Toggle to dark mode
    await userEvent.click(toggleButton);
    // Now the button label should be 'Switch to light mode'
    toggleButton = await screen.findByRole('button', { name: /switch to light mode/i });
    expect(toggleButton).toBeInTheDocument();

    // Toggle back to light mode
    await userEvent.click(toggleButton);
    toggleButton = await screen.findByRole('button', { name: /switch to dark mode/i });
    expect(toggleButton).toBeInTheDocument();
});
