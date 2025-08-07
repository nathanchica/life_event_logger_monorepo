/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import EventOptionsDropdown from './EventOptionsDropdown';

import useMuiState from '../../hooks/useMuiState';
import { useToggle } from '../../utils/useToggle';

type Props = {
    eventId: string;
    name: string;
    onEditEvent: () => void;
    onDeleteEvent: () => void;
};

const EventCardHeader = ({ eventId, name, onEditEvent, onDeleteEvent }: Props) => {
    const { value: isDropdownShowing, setTrue: showDropdown, setFalse: hideDropdown } = useToggle();
    const { isMobile } = useMuiState();

    const handleEditClick = () => {
        onEditEvent();
        hideDropdown();
    };

    const handleDeleteClick = () => {
        onDeleteEvent();
        hideDropdown();
    };

    return (
        <Grid container alignItems="center" sx={{ mb: 1.5, pr: 1 }}>
            <Grid size={11}>
                <Typography variant={isMobile ? 'h6' : 'h5'} id={`event-title-${eventId}`} component="h2">
                    {name}
                </Typography>
            </Grid>
            <Grid size={1}>
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
                        size="small"
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
