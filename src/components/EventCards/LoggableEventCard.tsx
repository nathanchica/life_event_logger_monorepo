import { useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import blue from '@mui/material/colors/blue';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EditEventCard from './EditEventCard';
import EventCard from './EventCard';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { getNumberOfDaysBetweenDates } from '../../utils/time';

// const WARNING_COLOR = red[50];

const DaysSinceLastEventDisplay = ({ lastEventRecordDate }: { lastEventRecordDate: Date }) => {
    const daysSinceLastEvent = getNumberOfDaysBetweenDates(lastEventRecordDate, new Date());

    let content = <Typography variant="subtitle1">Last event: {daysSinceLastEvent} days ago</Typography>;
    if (daysSinceLastEvent === 0) {
        content = <Typography variant="subtitle1">Last event: Today</Typography>;
    } else if (daysSinceLastEvent === 1) {
        content = <Typography variant="subtitle1">Last event: Yesterday</Typography>;
    }

    return content;
};

type EventOptionsDropdownProps = {
    onDismiss: () => void;
    onEditEventClick: () => void;
    onDeleteEventClick: () => void;
};

const EventOptionsDropdown = ({ onDismiss, onEditEventClick, onDeleteEventClick }: EventOptionsDropdownProps) => {
    const DropdownItem = ({ name, icon, onClick }: { name: string; icon: ReactNode; onClick: () => void }) => (
        <ListItem disablePadding>
            <ListItemButton
                css={css`
                    :hover {
                        background-color: ${blue[100]};
                    }
                `}
                onClick={onClick}
            >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={name} />
            </ListItemButton>
        </ListItem>
    );

    return (
        <ClickAwayListener onClickAway={onDismiss}>
            <Paper
                elevation={5}
                css={css`
                    position: absolute;
                    width: 200px;
                    // https://mui.com/material-ui/customization/z-index/#main-content
                    z-index: 1500;
                `}
            >
                <List disablePadding>
                    <DropdownItem name="Edit event" icon={<EditIcon />} onClick={onEditEventClick} />
                    <DropdownItem name="Delete event" icon={<DeleteIcon />} onClick={onDeleteEventClick} />
                </List>
            </Paper>
        </ClickAwayListener>
    );
};

type Props = {
    eventName: string;
};

const LoggableEventCard = ({ eventName }: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [eventOptionsDropdownIsShowing, setEventOptionsDropdownIsShowing] = useState(false);
    const showEventOptionsDropdown = () => {
        setEventOptionsDropdownIsShowing(true);
    };
    const hideEventOptionsDropdown = () => {
        setEventOptionsDropdownIsShowing(false);
    };

    const [formIsShowing, setFormIsShowing] = useState(false);
    const hideForm = () => {
        setFormIsShowing(false);
    };

    const { loggableEvents, addRecordToEvent, removeLoggableEvent } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ name }) => name === eventName);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const { id, name, eventRecords } = currentLoggableEvent;

    const handleLogEventClick = async () => {
        setIsSubmitting(true);
        await addRecordToEvent(id);
        setIsSubmitting(false);
    };

    const handleEditEventClick = () => {
        setFormIsShowing(true);
        hideEventOptionsDropdown();
    };

    const handleDeleteEventClick = () => {
        removeLoggableEvent(id);
        hideEventOptionsDropdown();
    };

    const lastEventRecord = currentLoggableEvent.eventRecords[0];

    return formIsShowing ? (
        <EditEventCard onDismiss={hideForm} eventIdToEdit={id} />
    ) : (
        <EventCard>
            <CardContent>
                <Grid container alignItems="baseline">
                    <Grid item xs={11}>
                        <Typography gutterBottom variant="h5">
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
                                onClick={showEventOptionsDropdown}
                                aria-label="unregister event"
                                component="span"
                            >
                                <MoreVertIcon />
                            </IconButton>
                            {eventOptionsDropdownIsShowing && (
                                <EventOptionsDropdown
                                    onDismiss={hideEventOptionsDropdown}
                                    onDeleteEventClick={handleDeleteEventClick}
                                    onEditEventClick={handleEditEventClick}
                                />
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <LoadingButton size="large" loading={isSubmitting} onClick={handleLogEventClick} variant="contained">
                    Log Event
                </LoadingButton>

                {lastEventRecord && <DaysSinceLastEventDisplay lastEventRecordDate={lastEventRecord} />}

                <List>
                    {eventRecords.map((record: Date) => {
                        return (
                            <ListItem disablePadding key={record.toISOString()}>
                                <ListItemText>{record.toLocaleString('en-US')}</ListItemText>
                            </ListItem>
                        );
                    })}
                </List>
            </CardContent>
        </EventCard>
    );
};

export default LoggableEventCard;
