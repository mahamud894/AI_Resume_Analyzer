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
import { requireAuth } from "../middleware/auth.js";
import { uploadResumeFiles } from "../middleware/upload.js";
import { analyzeRules, idParamRules } from "../middleware/validate.js";

const router = Router();

// Every resume route needs a logged-in user
router.use(requireAuth);

router.post("/upload", uploadResumeFiles, uploadResume);
router.post("/analyze", analyzeRules, analyze);
router.get("/", listResumes);
router.get("/:id", idParamRules, getResume);
router.get("/:id/file", idParamRules, getResumeFile);
router.get("/:id/image", idParamRules, getResumeImage);
router.delete("/:id", idParamRules, deleteResume);

export default router;
