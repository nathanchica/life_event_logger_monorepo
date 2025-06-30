import { useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import blue from '@mui/material/colors/blue';
import grey from '@mui/material/colors/grey';
import AddIcon from '@mui/icons-material/Add';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EditEventCard from './EditEventCard';

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
                css={css`
                    width: 400px;
                    height: 200px;
                `}
            >
                <Box
                    css={css`
                        margin: auto;
                    `}
                >
                    <AddIcon color="inherit" />
                </Box>
            </ButtonBase>
        </Box>
    );
};

export default CreateEventCard;
