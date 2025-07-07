/** @jsxImportSource @emotion/react */

import { useState } from 'react';

import { css } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { blue, grey } from '@mui/material/colors';
import { visuallyHidden } from '@mui/utils';

import EditEventCard from './EditEventCard';
import { CARD_WIDTH } from './EventCard';

/**
 * CreateEventCard component for displaying a card that allows users to create a new event.
 * It shows a dashed border with an add icon, and when clicked, it opens a form to create a new event.
 */
const CreateEventCard = () => {
    const [formIsShowing, setFormIsShowing] = useState(false);
    const hideForm = () => {
        setFormIsShowing(false);
    };

    const handleAddEventCardClick = () => {
        setFormIsShowing(true);
    };

    return formIsShowing ? (
        <EditEventCard onDismiss={hideForm} />
    ) : (
        <Box
            css={css`
                border-radius: 8px;
                border: 1px dashed ${grey[400]};
                color: ${grey[400]};

                :hover {
                    border-color: ${blue[400]};
                    color: ${blue[400]};
                }
            `}
        >
            <ButtonBase
                onClick={handleAddEventCardClick}
                aria-label="Add event"
                aria-describedby="create-event-help"
                css={css`
                    width: ${CARD_WIDTH};
                    height: 200px;
                `}
            >
                <Box
                    css={css`
                        margin: auto;
                    `}
                >
                    <AddIcon color="inherit" aria-hidden="true" />
                    <Box id="create-event-help" sx={visuallyHidden}>
                        Click to create a new event
                    </Box>
                </Box>
            </ButtonBase>
        </Box>
    );
};

export default CreateEventCard;
