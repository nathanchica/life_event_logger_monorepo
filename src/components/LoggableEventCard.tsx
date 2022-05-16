import PropTypes from 'prop-types';
import invariant from 'tiny-invariant';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// import red from '@mui/material/colors/red';
import RemoveIcon from '@mui/icons-material/CloseRounded';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';

// const WARNING_COLOR = red[50];

type Props = {
    eventName: string;
};

const LoggableEventCard = ({ eventName }: Props) => {
    const { showLoggableEventEditor } = useComponentDisplayContext();
    const { loggableEvents, addRecordToEvent, removeLoggableEvent } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ name }) => name === eventName);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const { name, logRecords } = currentLoggableEvent;

    function handleLogEventClick() {
        addRecordToEvent(name);
    }

    function handleEditEventClick() {
        showLoggableEventEditor(name);
    }

    function handleUnregisterEventClick() {
        removeLoggableEvent(name);
    }

    return (
        <Card
            variant="outlined"
            css={css`
                width: 400px;
            `}
        >
            <CardContent>
                <Grid container alignItems="baseline">
                    <Grid item xs={11}>
                        <Typography gutterBottom variant="h5">
                            {name}
                        </Typography>
                    </Grid>
                    <Grid item xs={1}>
                        <IconButton onClick={handleUnregisterEventClick} aria-label="unregister event" component="span">
                            <RemoveIcon />
                        </IconButton>
                    </Grid>
                </Grid>
                <Button variant="contained" onClick={handleLogEventClick}>
                    Log Event
                </Button>
                <Button onClick={handleEditEventClick}>Edit</Button>

                <List>
                    {logRecords.map(({ displayText, isoString }) => {
                        return (
                            <ListItem disablePadding key={isoString}>
                                <ListItemText>{displayText}</ListItemText>
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
