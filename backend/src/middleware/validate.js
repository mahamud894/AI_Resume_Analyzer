// Input validation rules (express-validator) + a middleware that rejects invalid requests.
import { body, param, validationResult } from "express-validator";
import { MAX_EDITED_TEXT } from "../models/CoverLetter.js";
import { TONES } from "../services/coverLetterService.js";
import ApiError from "../utils/ApiError.js";

// Put this after a list of rules: it stops the request with 400 if any rule failed.
export function validate(req, _res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
        throw ApiError.badRequest(details[0].message, details);
    }
    next();
}

export const registerRules = [
    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters")
        .matches(/^[a-zA-Z0-9_.]+$/)
        .withMessage("Username may only contain letters, numbers, _ and ."),
    body("email").trim().isEmail().withMessage("A valid email is required").toLowerCase(),
    body("password")
        .isString()
        .isLength({ min: 8, max: 72 })
        .withMessage("Password must be 8-72 characters"),
    validate,
];

export const loginRules = [
    body("email").trim().isEmail().withMessage("A valid email is required").toLowerCase(),
    body("password").isString().notEmpty().withMessage("Password is required"),
    validate,
];

export const changePasswordRules = [
    // Optional here: Google-only accounts set their first password without one (the controller checks the rest)
    body("currentPassword").optional().isString().withMessage("Current password must be text"),
    body("newPassword")
        .isString()
        .isLength({ min: 8, max: 72 })
        .withMessage("New password must be 8-72 characters"),
    validate,
];

// password for normal accounts, confirmEmail for Google-only ones; the controller decides which is needed
export const deleteAccountRules = [
    body("password").optional().isString().withMessage("Password must be text"),
    body("confirmEmail").optional().isString().withMessage("confirmEmail must be text"),
    validate,
];

export const googleLoginRules = [
    body("credential").isString().isLength({ min: 20, max: 4096 }).withMessage("A Google credential is required"),
    validate,
];

export const analyzeRules = [
    body("resumeId").isMongoId().withMessage("A valid resumeId is required"),
    body("companyName")
        .optional({ values: "falsy" })
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Company name must be at most 100 characters"),
    body("jobTitle")
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Job title is required (max 100 characters)"),
    body("jobDescription")
        .isString()
        .trim()
        .isLength({ min: 20, max: 10000 })
        .withMessage("Job description must be 20-10000 characters"),
    validate,
];

export const coverLetterRules = [
    body("hiringManagerName")
        .optional({ values: "null" })
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Hiring manager name must be at most 100 characters"),
    body("companyAddress")
        .optional({ values: "null" })
        .isString()
        .trim()
        .isLength({ max: 300 })
        .withMessage("Company address must be at most 300 characters"),
    body("jobSource")
        .optional({ values: "null" })
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Job source must be at most 100 characters"),
    body("tone")
        .optional({ values: "null" })
        .isIn(TONES)
        .withMessage(`Tone must be one of: ${TONES.join(", ")}`),
    validate,
];

export const coverLetterEditRules = [
    body("editedText")
        .isString()
        .withMessage("editedText must be text")
        .isLength({ max: MAX_EDITED_TEXT })
        .withMessage(`The letter must be at most ${MAX_EDITED_TEXT} characters`),
    validate,
];

export const improvedEditRules = [
    body("europassCv")
        .custom((v) => v === null || (typeof v === "object" && !Array.isArray(v)))
        .withMessage("europassCv must be an object (or null to reset to the AI version)"),
    validate,
];

export const analysisIdParamRules = [
    param("analysisId").isMongoId().withMessage("Invalid analysis id"),
    validate,
];

export const idParamRules = [
    param("id").isMongoId().withMessage("Invalid resume id"),
    validate,
];
