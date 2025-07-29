import { useState } from 'react';

import { gql, useFragment } from '@apollo/client';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import invariant from 'tiny-invariant';

import CreateEventLabelForm from './CreateEventLabelForm';
import EventLabel from './EventLabel';

import { useAuth } from '../../providers/AuthProvider';

type EventLabelFragment = {
    id: string;
    name: string;
};

const EVENT_LABELS_FOR_USER_FRAGMENT = gql`
    fragment EventLabelsForUserFragment on User {
        eventLabels {
            id
            name
        }
    }
`;

type Props = {
    isShowingEditActions: boolean;
};

/**
 * EventLabelList component for displaying and managing a list of event labels.
 */
const EventLabelList = ({ isShowingEditActions }: Props) => {
    const { user } = useAuth();

    invariant(user, 'User is not authenticated');

    const [createLabelFormIsShowing, setCreateLabelFormIsShowing] = useState(false);

    const { complete, data } = useFragment({
        fragment: EVENT_LABELS_FOR_USER_FRAGMENT,
        fragmentName: 'EventLabelsForUserFragment',
        from: {
            __typename: 'User',
            id: user.id
        }
    });

    const eventLabelsFragments: Array<EventLabelFragment> = complete ? data.eventLabels : [];
    const existingLabelNames = eventLabelsFragments.map((fragment) => fragment.name);

    const showCreateLabelForm = () => {
        setCreateLabelFormIsShowing(true);
    };
    const hideCreateLabelForm = () => {
        setCreateLabelFormIsShowing(false);
    };

    return (
        <Box>
            <List disablePadding>
                <ListItem disablePadding>
                    {createLabelFormIsShowing ? (
                        <CreateEventLabelForm
                            onCancel={hideCreateLabelForm}
                            onSuccess={hideCreateLabelForm}
                            existingLabelNames={existingLabelNames}
                        />
                    ) : (
                        <ListItemButton dense disableRipple onClick={showCreateLabelForm}>
                            <ListItemIcon>
                                <AddIcon />
                            </ListItemIcon>
                            <ListItemText primary="Create new label" />
                        </ListItemButton>
                    )}
                </ListItem>

                {eventLabelsFragments.map(({ id }) => {
                    return (
                        <EventLabel
                            key={id}
                            eventLabelId={id}
                            isShowingEditActions={isShowingEditActions}
                            existingLabelNames={existingLabelNames}
                        />
                    );
                })}
            </List>
        </Box>
    );
};

EventLabelList.fragments = {
    eventLabelsForUser: EVENT_LABELS_FOR_USER_FRAGMENT
};

export default EventLabelList;
