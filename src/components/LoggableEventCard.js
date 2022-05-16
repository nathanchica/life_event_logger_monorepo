import PropTypes from 'prop-types';
import invariant from 'invariant';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import RemoveIcon from '@mui/icons-material/CloseRounded';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';

const LoggableEventCard = ({ eventId }) => {
    const { loggableEvents, addRecordToEvent, removeLoggableEvent } = useLoggableEventsContext();
    const currentEvent = loggableEvents.find(({ id }) => id === eventId);

    invariant(currentEvent, 'Must be a valid event');

    const { id, logRecords } = currentEvent;

    const handleLogEventClick = () => {
        addRecordToEvent(id);
    };

    const handleUnregisterEventClick = () => {
        removeLoggableEvent(id);
    };

    return (
        <Card
            variant="outlined"
            css={css`
                width: 400px;
            `}>
            <CardContent>
                <Grid justifyContent="flex-start" container spacing={1} alignItems="baseline">
                    <Grid item xs={8}>
                        <Typography variant="h5">{id}</Typography>
                    </Grid>
                    <Grid item xs={2} />
                    <Grid item xs={2}>
                        <IconButton
                            onClick={handleUnregisterEventClick}
                            size="large"
                            aria-label="unregister event"
                            component="span">
                            <RemoveIcon />
                        </IconButton>
                    </Grid>
                </Grid>
                <Button variant="contained" onClick={handleLogEventClick}>
                    Log Event
                </Button>

                <List>
                    {logRecords.map(({ displayString, id: recordId }) => {
                        return (
                            <ListItem disablePadding key={recordId}>
                                <ListItemText>{displayString}</ListItemText>
                            </ListItem>
                        );
                    })}
                </List>
            </CardContent>
        </Card>
    );
};

LoggableEventCard.propTypes = {
    eventId: PropTypes.string
};

export default LoggableEventCard;
