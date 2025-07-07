import '@fontsource/roboto';

import * as React from 'react';

import { createRoot } from 'react-dom/client';

import CssBaseline from '@mui/material/CssBaseline';

import './index.css';
import App from './App';

const root = createRoot(document.getElementById('root') as Element);

root.render(
    <React.StrictMode>
        <CssBaseline enableColorScheme />
        <App />
    </React.StrictMode>
);
