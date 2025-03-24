export class AppError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, AppError);
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                code: this.code,
                details: this.details
            }
        };
    }
}

export class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 'AUTHENTICATION_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}

export class ConcurrencyError extends AppError {
    constructor(message = 'Resource was modified by another request') {
        super(message, 'CONCURRENCY_ERROR', 409);
        this.name = 'ConcurrencyError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource, id) {
        super(
            `${resource} not found${id ? `: ${id}` : ''}`,
            'NOT_FOUND',
            404,
            { resource, id }
        );
        this.name = 'NotFoundError';
    }
}

// Error handler middleware
export function errorHandler(err, req, res, next) {
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
        details: err.details
    });

    // Handle known errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle CSRF errors
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            error: {
                message: 'Invalid CSRF token',
                code: 'INVALID_CSRF_TOKEN'
            }
        });
    }

    // Handle validation errors from express-validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            error: {
                message: 'Validation error',
                code: 'VALIDATION_ERROR',
                details: err.array()
            }
        });
    }

    // Handle unexpected errors
    const error = new AppError(
        'An unexpected error occurred',
        'INTERNAL_ERROR',
        500,
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    );

    return res.status(500).json(error.toJSON());
}

// Async handler wrapper
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
