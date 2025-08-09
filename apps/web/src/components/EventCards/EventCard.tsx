import { ReactNode, ComponentProps, forwardRef } from 'react';

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
 *
 * Passing ref to underlying MUI Grid component for use with MUI ClickAwayListener
 * https://mui.com/material-ui/guides/composition/#caveat-with-refs
 */
const EventCard = forwardRef<HTMLDivElement, Props>(({ children, ...cardProps }, ref) => {
    const { isDarkMode } = useMuiState();

    return (
        <EventCardGridItem ref={ref}>
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
});

export default EventCard;
