// Protects routes: requires a valid "Authorization: Bearer <token>" header.
// On success the logged-in user is available as req.user in the controller.
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, _res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw ApiError.unauthorized("Authentication token missing");
    }

    let payload;
    try {
        payload = verifyToken(token);
    } catch (err) {
        throw ApiError.unauthorized(
            err.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid token"
        );
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized("User no longer exists");

    req.user = user;
    next();
}
