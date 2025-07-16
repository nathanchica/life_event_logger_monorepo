import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

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

export function generateJWT(payload: { userId: string; email: string }) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

export function verifyJWT(token: string) {
    try {
        return jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    } catch {
        return null;
    }
}
