import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';

import EventCardGridItem from './EventCardGridItem';

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
                    height={200}
                    aria-label="Loading event card"
                />
            </Grow>
        </EventCardGridItem>
    );
};

export default EventCardShimmer;
