import { OAuth2Client } from 'google-auth-library';

import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: env.GOOGLE_CLIENT_ID
        });
        return ticket.getPayload();
    } catch {
        return null;
    }
}
