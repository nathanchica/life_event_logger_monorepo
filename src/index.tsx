import '@fontsource/roboto';

import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root') as Element);

/**
 * Adding user authorization token to request headers
 * https://www.apollographql.com/docs/react/networking/authentication
 */
const httpLink = createHttpLink({
    uri: 'http://localhost:4000',
    credentials: 'include'
});
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : ''
        }
    };
});
const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
});

root.render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <ApolloProvider client={client}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <CssBaseline />
                    <App />
                </LocalizationProvider>
            </ApolloProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
