import { ReactNode } from 'react';

import Grid from '@mui/material/Grid';

export const DESKTOP_CARD_MAX_WIDTH = '400px';

type Props = {
    children: ReactNode;
};

/**
 * EventCardGridItem component that provides a consistent Grid item wrapper for event cards.
 */
const EventCardGridItem = ({ children }: Props) => {
    return (
        <Grid role="listitem" size={{ xs: 12, sm: 6, md: 4, lg: 4 }} sx={{ maxWidth: DESKTOP_CARD_MAX_WIDTH }}>
            {children}
        </Grid>
    );
};

export default EventCardGridItem;
