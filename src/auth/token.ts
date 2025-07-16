import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

let client: OAuth2Client | null = null;

function getOAuth2Client() {
    if (!client) {
        console.log('Initializing OAuth2Client...');
        client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        console.log('OAuth2Client initialized');
    }
    return client;
}

export async function verifyGoogleToken(token: string) {
    console.log('verifyGoogleToken called');
    try {
        const oauthClient = getOAuth2Client();
        console.log('Calling Google API to verify token...');
        const ticket = await oauthClient.verifyIdToken({
            idToken: token,
            audience: env.GOOGLE_CLIENT_ID
        });
        console.log('Google API call completed');
        return ticket.getPayload();
    } catch (error) {
        console.error('Google token verification error:', error);
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
