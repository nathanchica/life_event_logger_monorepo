import { useState } from 'react';
import invariant from 'tiny-invariant';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
// import red from '@mui/material/colors/red';
import RemoveIcon from '@mui/icons-material/CloseRounded';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { getNumberOfDaysBetweenDates } from '../utils/time';

// const WARNING_COLOR = red[50];

const DaysSinceLastEventDisplay = ({ lastEventRecordDate }: { lastEventRecordDate: Date }) => {
    const daysSinceLastEvent = getNumberOfDaysBetweenDates(lastEventRecordDate, new Date());
    const content =
        daysSinceLastEvent === 0 ? (
            <Typography variant="body2">Last event: Today</Typography>
        ) : (
            <Typography variant="body2">Last event: {daysSinceLastEvent} days ago</Typography>
        );

    return (
        <div
            css={css`
                margin-top: 16px;
            `}
        >
            {content}
        </div>
    );
};

type Props = {
    eventName: string;
};

const LoggableEventCard = ({ eventName }: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showLoggableEventEditor } = useComponentDisplayContext();
    const { loggableEvents, addRecordToEvent, removeLoggableEvent } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ name }) => name === eventName);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const { name, logRecords } = currentLoggableEvent;

    const handleLogEventClick = async () => {
        setIsSubmitting(true);
        await addRecordToEvent(name);
        setIsSubmitting(false);
    };

    const handleEditEventClick = () => {
        showLoggableEventEditor(name);
    };

    const handleUnregisterEventClick = () => {
        removeLoggableEvent(name);
    };

    const lastEventRecord = currentLoggableEvent.logRecords[0];

    const logEventButton = isSubmitting ? (
        <LoadingButton variant="contained" loadingPosition="end">
            Log Event
        </LoadingButton>
    ) : (
        <Button variant="contained" onClick={handleLogEventClick}>
            Log Event
        </Button>
    );

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
                {logEventButton}
                <Button disableRipple onClick={handleEditEventClick}>
                    Edit
                </Button>

                {lastEventRecord && <DaysSinceLastEventDisplay lastEventRecordDate={lastEventRecord.dateObject} />}

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

export default LoggableEventCard;
