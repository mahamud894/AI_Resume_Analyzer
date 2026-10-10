// Multer configuration for resume uploads.
//   field "resume" → required, PDF only
//   field "image"  → optional PNG/JPEG preview of page 1 (generated in the browser by pdf.js)
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

const ALLOWED = {
    resume: { mimes: ["application/pdf"], exts: [".pdf"] },
    image: { mimes: ["image/png", "image/jpeg"], exts: [".png", ".jpg", ".jpeg"] },
};

const storage = multer.diskStorage({
    destination: config.uploadDir,
    // Never trust the user's file name — generate our own random one.
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
});

function fileFilter(_req, file, cb) {
    const rule = ALLOWED[file.fieldname];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!rule) return cb(ApiError.badRequest(`Unexpected file field "${file.fieldname}"`));
    if (!rule.mimes.includes(file.mimetype) || !rule.exts.includes(ext)) {
        const expected = file.fieldname === "resume" ? "a PDF file" : "a PNG or JPEG image";
        return cb(ApiError.badRequest(`"${file.fieldname}" must be ${expected}`));
    }
    cb(null, true);
}

export const uploadResumeFiles = multer({
    storage,
    fileFilter,
    limits: { fileSize: config.maxFileSizeMb * 1024 * 1024, files: 2 },
}).fields([
    { name: "resume", maxCount: 1 },
    { name: "image", maxCount: 1 },
]);
