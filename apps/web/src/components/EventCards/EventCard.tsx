import { ReactNode, ComponentProps } from 'react';

import Card from '@mui/material/Card';
import Grow from '@mui/material/Grow';
import { amber, grey } from '@mui/material/colors';

import EventCardGridItem from './EventCardGridItem';

import useMuiState from '../../hooks/useMuiState';

type Props = {
    children: ReactNode;
} & ComponentProps<typeof Card>;

/**
 * EventCard component for displaying a single event card.
 */
const EventCard = ({ children, ...cardProps }: Props) => {
    const { isDarkMode } = useMuiState();

    return (
        <EventCardGridItem>
            <Grow in>
                <Card
                    sx={{
                        backgroundColor: isDarkMode ? grey[800] : amber[50],
                        overflow: 'visible',
                        '&:hover': {
                            boxShadow: 3
                        }
                    }}
                    role="article"
                    aria-label="Event card"
                    {...cardProps}
                >
                    {children}
                </Card>
            </Grow>
        </EventCardGridItem>
    );
};

export default EventCard;
