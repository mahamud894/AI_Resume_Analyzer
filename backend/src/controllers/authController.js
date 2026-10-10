import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
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
    // Same message for "no such user" and "wrong password" so attackers can't guess emails
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    res.json({ token: signToken(user._id), user });
}

// GET /api/auth/me
export async function me(req, res) {
    res.json({ user: req.user });
}
