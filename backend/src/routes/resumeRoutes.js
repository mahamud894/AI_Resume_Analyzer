import { Router } from "express";
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

router.post("/upload", uploadResumeFiles, uploadResume);
router.post("/analyze", analyzeRules, analyze);
router.post("/analysis/:analysisId/improve", analysisIdParamRules, improve);
router.get("/analysis/:analysisId/improved", analysisIdParamRules, getImproved);
router.put("/analysis/:analysisId/improved", analysisIdParamRules, improvedEditRules, saveImprovedEdit);
router.post("/analysis/:analysisId/cover-letter", analysisIdParamRules, coverLetterRules, createCoverLetter);
router.get("/analysis/:analysisId/cover-letter", analysisIdParamRules, getCoverLetter);
router.put("/analysis/:analysisId/cover-letter", analysisIdParamRules, coverLetterEditRules, saveCoverLetterEdit);
router.get("/", listResumes);
router.get("/:id", idParamRules, getResume);
router.get("/:id/file", idParamRules, getResumeFile);
router.get("/:id/image", idParamRules, getResumeImage);
router.delete("/:id", idParamRules, deleteResume);

export default router;
