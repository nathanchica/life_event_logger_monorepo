import { render, screen } from '@testing-library/react';

import EventCardGridItem from './EventCardGridItem';

import useMuiState from '../../hooks/useMuiState';

jest.mock('../../hooks/useMuiState');

const mockUseMuiState = useMuiState;

describe('EventCardGridItem', () => {
    it.each([
        { isMobile: true, description: 'mobile view' },
        { isMobile: false, description: 'desktop view' }
    ])('renders children in $description', ({ isMobile }) => {
        mockUseMuiState.mockReturnValue({
            theme: {},
            isMobile,
            isDarkMode: false
        });

        const childText = 'Test Child Component';

        render(
            <EventCardGridItem>
                <div>{childText}</div>
            </EventCardGridItem>
        );

        expect(screen.getByText(childText)).toBeInTheDocument();
    });
});
