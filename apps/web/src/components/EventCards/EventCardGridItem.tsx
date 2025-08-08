import { ReactNode } from 'react';

import Grid from '@mui/material/Grid';

const DESKTOP_CARD_MAX_WIDTH = '400px';
const CARD_MIN_WIDTH = '280px';

type Props = {
    children: ReactNode;
};

/**
 * EventCardGridItem component that provides a consistent Grid item wrapper for event cards.
 */
const EventCardGridItem = ({ children }: Props) => {
    return (
        <Grid
            role="listitem"
            size={{ xs: 12, sm: 6, md: 4, lg: 4 }}
            sx={{ maxWidth: DESKTOP_CARD_MAX_WIDTH, minWidth: CARD_MIN_WIDTH }}
        >
            {children}
        </Grid>
    );
};

export default EventCardGridItem;
