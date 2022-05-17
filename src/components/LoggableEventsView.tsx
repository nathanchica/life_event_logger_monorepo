import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import orange from '@mui/material/colors/orange';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import LoggableEventCard from './LoggableEventCard';
import LoggableEventEditor from './LoggableEventEditor';
import LoggableEventList from './LoggableEventList';
import CreateEventForm from './CreateEventForm';

const LoggableEventsView = () => {
    const { loggableEventNameToEdit, hideLoggableEventEditor, loadingSpinnerIsVisible } = useComponentDisplayContext();
    const { loggableEvents } = useLoggableEventsContext();

    const sidebar = (
        <Grid
            item
            css={css`
                background-color: ${orange[50]};
                padding: 24px;
                width: 400px;
            `}
        >
            <Typography variant="h4" gutterBottom>
                Event Logger
            </Typography>
            <CreateEventForm />

            <div
                css={css`
                    display: block;
                `}
            >
                <LoggableEventList />
            </div>
        </Grid>
    );

    const mainContent = loadingSpinnerIsVisible ? (
        <Grid item xs={12}>
            <CircularProgress />
        </Grid>
    ) : (
        <Grid
            item
            xs={12}
            css={css`
                padding: 56px;
            `}
        >
            <Grid container spacing={5}>
                {loggableEvents
                    .filter(({ active }) => active)
                    .map(({ name }) => {
                        return (
                            <Grid item key={`${name}-card`}>
                                <LoggableEventCard eventName={name} />
                            </Grid>
                        );
                    })}
            </Grid>
        </Grid>
    );

    return (
        <>
            <Grid
                container
                wrap="nowrap"
                css={css`
                    height: 100vh;
                    width: 100vw;
                `}
            >
                {sidebar}

                {mainContent}
            </Grid>

            {loggableEventNameToEdit && (
                <LoggableEventEditor eventName={loggableEventNameToEdit} onClose={hideLoggableEventEditor} />
            )}
        </>
    );
};

export default LoggableEventsView;
