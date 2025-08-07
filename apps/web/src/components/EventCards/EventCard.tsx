/** @jsxImportSource @emotion/react */

import { ReactNode, ComponentProps } from 'react';

import { css } from '@emotion/react';
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
                    css={css`
                        background-color: ${isDarkMode ? grey[800] : amber[50]};
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
                    {...cardProps}
                >
                    {children}
                </Card>
            </Grow>
        </EventCardGridItem>
    );
};

export default EventCard;
