// Central error handling: every error thrown in a route ends up here
// and is converted into one consistent JSON shape: { message, details? }
import multer from "multer";
import mongoose from "mongoose";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export function notFound(req, _res, next) {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
    let status = err.statusCode || 500;
    let message = err.message || "Internal server error";
    let details = err.details;

    if (err instanceof multer.MulterError) {
        status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        message =
            err.code === "LIMIT_FILE_SIZE"
                ? `File too large (max ${config.maxFileSizeMb} MB)`
                : `Upload error: ${err.message}`;
    } else if (err instanceof mongoose.Error.ValidationError) {
        status = 400;
        details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        message = details[0]?.message || "Validation failed";
    } else if (err instanceof mongoose.Error.CastError) {
        status = 400;
        message = `Invalid ${err.path}`;
    } else if (err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `That ${field} is already in use`;
    } else if (err.type === "entity.parse.failed") {
        status = 400;
        message = "Request body is not valid JSON";
    }

    // Unexpected errors (bugs, crashes) are logged; in production their details stay hidden.
    const unexpected = status >= 500 && !(err instanceof ApiError);
    if (unexpected) {
        console.error(err);
        if (config.isProduction) message = "Internal server error";
    }

    res.status(status).json({
        message,
        ...(details ? { details } : {}),
        ...(unexpected && !config.isProduction ? { stack: err.stack } : {}),
    });
}
