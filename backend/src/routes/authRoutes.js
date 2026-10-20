import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changePassword, deleteAccount, googleLogin, login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { changePasswordRules, deleteAccountRules, googleLoginRules, loginRules, registerRules } from "../middleware/validate.js";

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
router.post("/google", authLimiter, googleLoginRules, googleLogin);
router.get("/me", requireAuth, me);
// Both ask for the password again, so they share the password-guessing limit
router.put("/password", authLimiter, requireAuth, changePasswordRules, changePassword);
router.delete("/me", authLimiter, requireAuth, deleteAccountRules, deleteAccount);

export default router;
