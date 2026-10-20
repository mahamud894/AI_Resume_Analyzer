import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    analyze,
    deleteResume,
    getResume,
    getResumeFile,
    getResumeImage,
    listResumes,
    uploadResume,
} from "../controllers/resumeController.js";
import { createCoverLetter, getCoverLetter, saveCoverLetterEdit } from "../controllers/coverLetterController.js";
import { getImproved, improve, saveImprovedEdit } from "../controllers/improveController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadResumeFiles } from "../middleware/upload.js";
import {
    analysisIdParamRules,
    analyzeRules,
    coverLetterEditRules,
    coverLetterRules,
    idParamRules,
    improvedEditRules,
} from "../middleware/validate.js";

const router = Router();

// Every resume route needs a logged-in user
router.use(requireAuth);

// Every Gemini call uses our shared API quota, so each user gets at most 15 AI requests per hour
// (analyze + improve + cover letter together). Counted per user, not per IP.
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 15,
    keyGenerator: (req) => req.user.id,
    // Failed requests (invalid input, unreadable PDF, Gemini busy/rate-limited) do not use up the quota
    skipFailedRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many AI requests, please try again in an hour" },
});

router.post("/upload", uploadResumeFiles, uploadResume);
router.post("/analyze", aiLimiter, analyzeRules, analyze);
router.post("/analysis/:analysisId/improve", aiLimiter, analysisIdParamRules, improve);
router.get("/analysis/:analysisId/improved", analysisIdParamRules, getImproved);
router.put("/analysis/:analysisId/improved", analysisIdParamRules, improvedEditRules, saveImprovedEdit);
router.post("/analysis/:analysisId/cover-letter", aiLimiter, analysisIdParamRules, coverLetterRules, createCoverLetter);
router.get("/analysis/:analysisId/cover-letter", analysisIdParamRules, getCoverLetter);
router.put("/analysis/:analysisId/cover-letter", analysisIdParamRules, coverLetterEditRules, saveCoverLetterEdit);
router.get("/", listResumes);
router.get("/:id", idParamRules, getResume);
router.get("/:id/file", idParamRules, getResumeFile);
router.get("/:id/image", idParamRules, getResumeImage);
router.delete("/:id", idParamRules, deleteResume);

export default router;
