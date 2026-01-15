import { body, param, query, ValidationChain } from 'express-validator';

// Auth validation
export const registerValidation: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .isIn(['candidate', 'recruiter', 'hiring_manager'])
        .withMessage('Invalid role'),
];

export const loginValidation: ValidationChain[] = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

// Job validation
export const createJobValidation: ValidationChain[] = [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('description').trim().notEmpty().withMessage('Job description is required'),
    body('companyId').optional().isInt().withMessage('Company ID must be an integer'),
];

export const updateJobValidation: ValidationChain[] = [
    param('id').isInt().withMessage('Job ID must be an integer'),
    body('title').optional().trim().notEmpty().withMessage('Job title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Job description cannot be empty'),
    body('status').optional().isIn(['open', 'closed']).withMessage('Invalid status'),
];

export const getJobValidation: ValidationChain[] = [
    param('id').isInt().withMessage('Job ID must be an integer'),
];

// Application validation
export const applyJobValidation: ValidationChain[] = [
    param('id').isInt().withMessage('Job ID must be an integer'),
];

export const changeStatusValidation: ValidationChain[] = [
    param('id').isInt().withMessage('Application ID must be an integer'),
    body('status')
        .isIn(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])
        .withMessage('Invalid status'),
];

export const getApplicationValidation: ValidationChain[] = [
    param('id').isInt().withMessage('Application ID must be an integer'),
];

// Pagination validation
export const paginationValidation: ValidationChain[] = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

// Filter validation
export const applicationFilterValidation: ValidationChain[] = [
    query('status')
        .optional()
        .isIn(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])
        .withMessage('Invalid status filter'),
];
