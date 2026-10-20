// Checks a "Sign in with Google" ID token. The browser gets the token from Google; we never trust
// what it says until Google's signature, our Client ID (audience) and the expiry have been verified.
import { OAuth2Client } from "google-auth-library";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

let client = null;

// Returns { googleId, email, name } for a valid token, or throws an ApiError
export async function verifyGoogleToken(idToken) {
    if (!config.googleClientId) {
        throw new ApiError(503, "Google sign-in is not configured (GOOGLE_CLIENT_ID is missing).");
    }
    client ??= new OAuth2Client(config.googleClientId);

    let payload;
    try {
        const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId });
        payload = ticket.getPayload();
    } catch {
        throw ApiError.unauthorized("Google sign-in failed. Please try again.");
    }

    // Only trust emails Google has verified, otherwise someone could claim another person's address
    if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw ApiError.unauthorized("Your Google account has no verified email address.");
    }

    return { googleId: payload.sub, email: payload.email.toLowerCase(), name: payload.name || "" };
}
