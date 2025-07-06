/** @jsxImportSource @emotion/react */

import { ReactNode, ComponentProps } from 'react';

import { css } from '@emotion/react';
import Card from '@mui/material/Card';
import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';
import amber from '@mui/material/colors/amber';
import grey from '@mui/material/colors/grey';
import { useTheme } from '@mui/material/styles';

export const CARD_WIDTH = '400px';

/**
 * EventCardSkeleton component for displaying a shimmer effect while the event card data is loading.
 */
export const EventCardSkeleton = () => {
    return (
        <Grow in>
            <Skeleton
                data-testid="event-card-shimmer"
                variant="rectangular"
                width={CARD_WIDTH}
                height={200}
                aria-label="Loading event card"
            />
        </Grow>
    );
};

type Props = {
    children: ReactNode;
} & ComponentProps<typeof Card>;

/**
 * EventCard component for displaying a single event card.
 */
const EventCard = (props: Props) => {
    const theme = useTheme();
    return (
        <Grow in>
            <Card
                css={css`
                    background-color: ${theme.palette.mode === 'dark' ? grey[800] : amber[50]};
                    width: ${CARD_WIDTH};
                    overflow: visible;

                    :hover {
                        box-shadow:
                            0px 2px 4px -1px rgb(0 0 0 / 20%),
                            0px 4px 5px 0px rgb(0 0 0 / 14%),
                            0px 1px 10px 0px rgb(0 0 0 / 12%);
                    }
                `}
                role="article"
                aria-label="Event card"
                {...props}
            >
                {props.children}
            </Card>
        </Grow>
    );
};

export default EventCard;
