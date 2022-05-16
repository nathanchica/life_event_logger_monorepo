import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { MAX_LENGTH } from '../components/CreateEventForm';

/**
 * Mock system time to mock new Date() value
 */
jest.useFakeTimers().setSystemTime(new Date('2020-05-10'));

const getNewEventInput = () => screen.getByRole('textbox', { name: 'Create a new event' });
const registerLoggableEvent = () => {
    userEvent.type(getNewEventInput(), 'get haircut');
    userEvent.click(screen.getByRole('button', { type: 'submit' }));
};

it('renders', () => {
    render(<App />);
    expect(screen.getByText(/Current Events/)).toBeInTheDocument();
});

it('handles loggable event creation', () => {
    render(<App />);

    expect(getNewEventInput()).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();

    registerLoggableEvent();

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'get haircut' })).toBeInTheDocument();
});

it('handles loggable event creation via form submit', () => {
    render(<App />);

    expect(getNewEventInput()).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();

    userEvent.type(getNewEventInput(), 'get haircut');
    fireEvent.submit(getNewEventInput());

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'get haircut' })).toBeInTheDocument();
});

it('handles disabling loggable event', () => {
    render(<App />);
    registerLoggableEvent();

    const checkbox = screen.getByRole('checkbox');
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'get haircut' })).toBeInTheDocument();

    userEvent.click(checkbox);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();
});

it('handles logging an event', () => {
    render(<App />);
    registerLoggableEvent();

    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Log Event' }));

    expect(screen.getByText(/2020/)).toBeInTheDocument();
});

it('validates event name length', () => {
    render(<App />);

    expect(screen.queryByText(/Event name is too long/)).not.toBeInTheDocument();

    userEvent.type(getNewEventInput(), 'a'.repeat(MAX_LENGTH + 1));

    expect(screen.getByRole('button', { type: 'submit' })).toBeDisabled();
    expect(screen.getByText(/Event name is too long/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();
});

it('handles empty event name input', () => {
    render(<App />);
    expect(screen.getByRole('button', { type: 'submit' })).toBeDisabled();

    fireEvent.submit(getNewEventInput());

    expect(screen.queryByRole('heading', { name: 'get haircut' })).not.toBeInTheDocument();
});
