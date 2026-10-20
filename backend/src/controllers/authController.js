import bcrypt from "bcryptjs";
import Analysis from "../models/Analysis.js";
import CoverLetter from "../models/CoverLetter.js";
import ImprovedResume from "../models/ImprovedResume.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { deleteFiles } from "../services/fileStorage.js";
import { verifyGoogleToken } from "../services/googleAuthService.js";
import { signToken } from "../utils/token.js";

const SALT_ROUNDS = 10;

// POST /api/auth/register
export async function register(req, res) {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        throw ApiError.conflict(
            existing.email === email ? "Email is already registered" : "Username is already taken"
        );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, passwordHash });

    res.status(201).json({ token: signToken(user._id), user });
}

// POST /api/auth/login
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (user && !user.hasPassword) {
        throw ApiError.unauthorized(
            "This account uses Google sign-in. Continue with Google, or set a password on the Account page."
        );
    }
    // Same message for "no such user" and "wrong password" so attackers can't guess emails
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    res.json({ token: signToken(user._id), user });
}

// Turns a Google name / email into a free username that passes registerRules (3-30 chars, a-z 0-9 _ .)
async function freeUsername(name, email) {
    const base =
        (name || email.split("@")[0])
            .normalize("NFKD")
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_.]/g, "")
            .slice(0, 24) || "user";
    const padded = base.length < 3 ? `${base}_user` : base;

    if (!(await User.exists({ username: padded }))) return padded;
    for (let i = 0; i < 20; i++) {
        const candidate = `${padded}_${Math.floor(1000 + Math.random() * 9000)}`;
        if (!(await User.exists({ username: candidate }))) return candidate;
    }
    throw new ApiError(500, "Could not create a username, please try again");
}

// POST /api/auth/google   { credential }  (the ID token from the "Sign in with Google" button)
// Logs in the account linked to this Google account. A first-time Google user with the same email as an
// existing account is linked to it (Google has verified the email); otherwise a new account is created.
export async function googleLogin(req, res) {
    const { googleId, email, name } = await verifyGoogleToken(req.body.credential);

    let user = await User.findOne({ googleId });
    let status = 200;
    if (!user) {
        user = await User.findOne({ email }).select("+googleId");
        if (user?.googleId) throw ApiError.conflict("This email is linked to a different Google account");
        if (user) {
            user.googleId = googleId;
            await user.save();
        } else {
            user = await User.create({ username: await freeUsername(name, email), email, googleId, hasPassword: false });
            status = 201;
        }
    }

    res.status(status).json({ token: signToken(user._id), user });
}

// GET /api/auth/me
export async function me(req, res) {
    res.json({ user: req.user });
}

// Loads the logged-in user with the hash and checks a password typed to confirm a sensitive action
async function checkOwnPassword(userId, password, message) {
    if (typeof password !== "string" || !password) throw ApiError.badRequest(message);
    const user = await User.findById(userId).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw ApiError.badRequest(message);
    }
    return user;
}

// PUT /api/auth/password   { currentPassword, newPassword }
// Returns a fresh token: every token issued before the change (other devices) stops working.
// Google-only accounts have no current password: for them this sets their first password.
export async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const user = req.user.hasPassword
        ? await checkOwnPassword(req.user._id, currentPassword, "Current password is incorrect")
        : req.user;

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.hasPassword = true;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ token: signToken(user._id), user });
}

// DELETE /api/auth/me   { password }  — or { confirmEmail } for a Google-only account (it has no password)
// Removes the account and everything that belongs to it, including the uploaded files.
export async function deleteAccount(req, res) {
    let user = req.user;
    if (user.hasPassword) {
        user = await checkOwnPassword(user._id, req.body.password, "Password is incorrect");
    } else if (String(req.body.confirmEmail || "").trim().toLowerCase() !== user.email) {
        throw ApiError.badRequest("Type your email address exactly to confirm");
    }

    const resumes = await Resume.find({ userId: user._id });
    // Independent collections, so they are cleared in parallel; the user goes last so a failure can be retried
    await Promise.all(
        [CoverLetter, ImprovedResume, Analysis, Resume].map((Model) => Model.deleteMany({ userId: user._id }))
    );
    await user.deleteOne();
    await deleteFiles(...resumes.flatMap((r) => [r.fileId, r.imageId]));

    res.json({ message: "Account deleted" });
}
