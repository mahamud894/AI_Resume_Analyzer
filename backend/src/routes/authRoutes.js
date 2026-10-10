import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { loginRules, registerRules } from "../middleware/validate.js";

const router = Router();

// Slows down password-guessing: max 20 login/register attempts per IP every 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again in 15 minutes" },
});

router.post("/register", authLimiter, registerRules, register);
router.post("/login", authLimiter, loginRules, login);
router.get("/me", requireAuth, me);

export default router;
