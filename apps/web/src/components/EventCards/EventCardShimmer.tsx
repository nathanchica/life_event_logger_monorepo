import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';

import EventCardGridItem, { DESKTOP_CARD_MAX_WIDTH } from './EventCardGridItem';

/**
 * EventCardShimmer component for displaying a shimmer effect while the event card data is loading.
 */
const EventCardShimmer = () => {
    return (
        <EventCardGridItem>
            <Grow in>
                <Skeleton
                    data-testid="event-card-shimmer"
                    variant="rectangular"
                    width={DESKTOP_CARD_MAX_WIDTH}
                    height={200}
                    aria-label="Loading event card"
                />
            </Grow>
        </EventCardGridItem>
    );
};

export default EventCardShimmer;
