// An Error that carries an HTTP status code.
// Throw it anywhere in a controller and the central error handler turns it into a JSON response.
export default class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.details = details;
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = "Not authenticated") {
        return new ApiError(401, message);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }
}
