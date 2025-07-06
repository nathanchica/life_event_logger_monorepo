import { useMemo } from 'react';

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';

import EventLoggerPage from './components/EventLoggerPage';
import AuthProvider from './providers/AuthProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides all context providers.
 */
const App = () => {
    /**
     * Adding user authorization token to request headers
     * https://www.apollographql.com/docs/react/networking/authentication
     */
    const client = useMemo(() => {
        const httpLink = createHttpLink({
            uri: 'http://localhost:4000',
            credentials: 'include'
        });

        /* istanbul ignore next - setContext callback only executes during GraphQL requests */
        const authLink = setContext((_, { headers }) => {
            const token = localStorage.getItem('token');
            return {
                headers: {
                    ...headers,
                    authorization: token ? `Bearer ${token}` : ''
                }
            };
        });

        return new ApolloClient({
            link: authLink.concat(httpLink),
            cache: new InMemoryCache()
        });
    }, []);

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <ApolloProvider client={client}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <CssBaseline />
                    <AuthProvider>
                        <ViewOptionsProvider>
                            <LoggableEventsProvider>
                                <EventLoggerPage />
                            </LoggableEventsProvider>
                        </ViewOptionsProvider>
                    </AuthProvider>
                </LocalizationProvider>
            </ApolloProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
