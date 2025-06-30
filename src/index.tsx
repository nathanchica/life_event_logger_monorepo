import '@fontsource/roboto';

import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import CssBaseline from '@mui/material/CssBaseline';

import './index.css';
import App from './App';

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
        <ApolloProvider client={client}>
            <CssBaseline />
            <App />
        </ApolloProvider>
    </React.StrictMode>
);
