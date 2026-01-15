import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Default error values
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;

    // Check if it's our custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    } else {
        // Handle known error types
        if (err.name === 'SequelizeValidationError') {
            statusCode = 400;
            message = 'Validation error: ' + err.message;
            isOperational = true;
        } else if (err.name === 'SequelizeUniqueConstraintError') {
            statusCode = 409;
            message = 'Resource already exists';
            isOperational = true;
        } else if (err.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Invalid token';
            isOperational = true;
        } else if (err.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Token expired';
            isOperational = true;
        }
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            statusCode,
        });
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
