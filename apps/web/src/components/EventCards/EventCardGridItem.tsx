import { ReactNode, forwardRef } from 'react';

import Grid from '@mui/material/Grid';

import useMuiState from '../../hooks/useMuiState';

const DESKTOP_CARD_MAX_WIDTH = '400px';
const CARD_MIN_WIDTH = '280px';

type Props = {
    children: ReactNode;
};

/**
 * EventCardGridItem component that provides a consistent Grid item wrapper for event cards.
 *
 * Passing ref to underlying MUI Grid component for use with MUI ClickAwayListener
 * https://mui.com/material-ui/guides/composition/#caveat-with-refs
 */
const EventCardGridItem = forwardRef<HTMLDivElement, Props>(({ children }, ref) => {
    const { isMobile } = useMuiState();

    return (
        <Grid
            ref={ref}
            role="listitem"
            size={{ xs: 12, sm: 6, md: 4, lg: 4 }}
            sx={{
                maxWidth: DESKTOP_CARD_MAX_WIDTH,
                ...(!isMobile && { minWidth: CARD_MIN_WIDTH })
            }}
        >
            {children}
        </Grid>
    );
});

export default EventCardGridItem;
