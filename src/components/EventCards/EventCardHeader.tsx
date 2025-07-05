import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EventOptionsDropdown from './EventOptionsDropdown';
import { useToggle } from '../../utils/useToggle';

type Props = {
    eventId: string;
    name: string;
    onEditEvent: () => void;
    onDeleteEvent: () => void;
};

const EventCardHeader = ({ eventId, name, onEditEvent, onDeleteEvent }: Props) => {
    const { value: isDropdownShowing, setTrue: showDropdown, setFalse: hideDropdown } = useToggle();

    const handleEditClick = () => {
        onEditEvent();
        hideDropdown();
    };

    const handleDeleteClick = () => {
        onDeleteEvent();
        hideDropdown();
    };

    return (
        <Grid container alignItems="baseline">
            <Grid item xs={11}>
                <Typography gutterBottom variant="h5" id={`event-title-${eventId}`} component="h2">
                    {name}
                </Typography>
            </Grid>
            <Grid item xs={1}>
                <Box
                    css={css`
                        position: relative;
                    `}
                >
                    <IconButton
                        onClick={showDropdown}
                        aria-label={`Event options for ${name}`}
                        aria-expanded={isDropdownShowing}
                        aria-haspopup="menu"
                        component="span"
                    >
                        <MoreVertIcon />
                    </IconButton>
                    {isDropdownShowing && (
                        <EventOptionsDropdown
                            onDismiss={hideDropdown}
                            onDeleteEventClick={handleDeleteClick}
                            onEditEventClick={handleEditClick}
                        />
                    )}
                </Box>
            </Grid>
        </Grid>
    );
};

export default EventCardHeader;
