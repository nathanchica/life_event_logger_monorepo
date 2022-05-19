import GoogleLogin from 'react-google-login';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import teal from '@mui/material/colors/teal';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

const LoginView = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleLoginSuccess = (response: any) => {
        console.log(response);
        // store authtoken in cookies
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGoogleLoginError = (error: any) => {
        console.error(error);
    };

    return (
        <Paper
            css={css`
                background-color: ${teal[50]};
                height: 100vh;
                width: 100vw;
            `}
        >
            <Box
                css={css`
                    margin: auto;
                `}
            >
                <GoogleLogin
                    clientId={process.env.GOOGLE_CLIENT_ID || ''}
                    buttonText="Login"
                    onSuccess={handleGoogleLoginSuccess}
                    onFailure={handleGoogleLoginError}
                />
            </Box>
        </Paper>
    );
};

export default LoginView;
