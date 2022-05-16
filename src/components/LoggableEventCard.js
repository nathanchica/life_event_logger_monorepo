import PropTypes from 'prop-types';
import invariant from 'invariant';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';

const LoggableEventCard = ({ eventId }) => {
    const { loggableEvents, addRecordToEvent } = useLoggableEventsContext();
    const currentEvent = loggableEvents.find(({ id }) => id === eventId);

    invariant(currentEvent, 'Must be a valid event');

    const { id, logRecords } = currentEvent;

    const handleLogEventClick = () => {
        addRecordToEvent(id);
    };

    return (
        <Card
            variant="outlined"
            css={css`
                width: 360px;
            `}>
            <CardContent>
                <Typography gutterBottom variant="h5">
                    {id}
                </Typography>
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
