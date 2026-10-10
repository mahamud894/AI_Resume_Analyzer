// Input validation rules (express-validator) + a middleware that rejects invalid requests.
import { body, param, validationResult } from "express-validator";
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
        .isLength({ min: 6, max: 72 })
        .withMessage("Password must be 6-72 characters"),
    validate,
];

export const loginRules = [
    body("email").trim().isEmail().withMessage("A valid email is required").toLowerCase(),
    body("password").isString().notEmpty().withMessage("Password is required"),
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

export const idParamRules = [
    param("id").isMongoId().withMessage("Invalid resume id"),
    validate,
];
