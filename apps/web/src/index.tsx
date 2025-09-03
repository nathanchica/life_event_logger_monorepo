import '@fontsource/roboto';

import * as React from 'react';

import { createRoot } from 'react-dom/client';

import CssBaseline from '@mui/material/CssBaseline';
import * as Sentry from '@sentry/react';

import './index.css';
import App from './App';

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true
});

const root = createRoot(document.getElementById('root') as Element);

root.render(
    <React.StrictMode>
        <CssBaseline enableColorScheme />
        <App />
    </React.StrictMode>
);
