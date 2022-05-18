import { ReactNode, ComponentProps } from 'react';

import Card from '@mui/material/Card';
import Grow from '@mui/material/Grow';
import Skeleton from '@mui/material/Skeleton';
import amber from '@mui/material/colors/amber';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

export const CARD_WIDTH = '400px';

export const EventCardSkeleton = () => {
    return (
        <Grow in>
            <Skeleton variant="rectangular" width={CARD_WIDTH} height={200} />
        </Grow>
    );
};

type Props = {
    children: ReactNode;
} & ComponentProps<typeof Card>;

const EventCard = (props: Props) => {
    return (
        <Grow in>
            <Card
                css={css`
                    background-color: ${amber[50]};
                    width: ${CARD_WIDTH};
                    overflow: visible;

                    :hover {
                        box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%),
                            0px 1px 10px 0px rgb(0 0 0 / 12%);
                    }
                `}
                {...props}
            >
                {props.children}
            </Card>
        </Grow>
    );
};

export default EventCard;
