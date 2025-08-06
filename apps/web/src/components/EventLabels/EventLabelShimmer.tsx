import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';

const EventLabelShimmer = () => {
    return (
        <Grow in>
            <Skeleton
                data-testid="event-label-shimmer"
                variant="rectangular"
                width="90%"
                height={50}
                aria-label="Loading event label"
                sx={{ ml: 2, mb: 2 }}
            />
        </Grow>
    );
};

export default EventLabelShimmer;
