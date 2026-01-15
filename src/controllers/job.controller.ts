import { Response } from 'express';
import { Job, User, Company } from '../models';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse, calculatePagination } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class JobController {
    // Create a new job (Recruiter only)
    async createJob(req: AuthRequest, res: Response) {
        try {
            const { title, description, companyId } = req.body;
            const recruiterId = req.user!.id;

            // If companyId is provided, verify recruiter belongs to that company
            if (companyId && req.user!.role === 'recruiter') {
                const recruiter = await User.findByPk(recruiterId);
                if (recruiter?.getDataValue('companyId') !== companyId) {
                    throw new ForbiddenError('You can only create jobs for your company');
                }
            }

            const job = await Job.create({
                title,
                description,
                recruiterId,
                companyId: companyId || req.user!.companyId || 1, // Default to company 1 if not specified
                status: 'open'
            });

            return successResponse(res, job, 201, 'Job created successfully');
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 400);
        }
    }

    // Get all jobs with pagination and filters
    async getAllJobs(req: AuthRequest, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status as string;
            const companyId = req.query.companyId as string;

            const offset = (page - 1) * limit;
            const where: any = {};

            if (status) where.status = status;
            if (companyId) where.companyId = parseInt(companyId);

            const { count, rows } = await Job.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    { model: User, as: 'recruiter', attributes: ['id', 'name', 'email'] },
                    { model: Company, as: 'company', attributes: ['id', 'name'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            const pagination = calculatePagination(page, limit, count);
            return paginatedResponse(res, rows, pagination);
        } catch (error: any) {
            return errorResponse(res, error.message, 500);
        }
    }

    // Get single job by ID
    async getJobById(req: AuthRequest, res: Response) {
        try {
            const jobId = parseInt(req.params.id);

            const job = await Job.findByPk(jobId, {
                include: [
                    { model: User, as: 'recruiter', attributes: ['id', 'name', 'email'] },
                    { model: Company, as: 'company', attributes: ['id', 'name'] }
                ]
            });

            if (!job) {
                throw new NotFoundError('Job not found');
            }

            return successResponse(res, job);
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    }

    // Update job (Recruiter only - own jobs)
    async updateJob(req: AuthRequest, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const { title, description, status } = req.body;
            const recruiterId = req.user!.id;

            const job = await Job.findByPk(jobId);

            if (!job) {
                throw new NotFoundError('Job not found');
            }

            // Verify ownership
            if (job.getDataValue('recruiterId') !== recruiterId) {
                throw new ForbiddenError('You can only update your own jobs');
            }

            await job.update({
                ...(title && { title }),
                ...(description && { description }),
                ...(status && { status })
            });

            return successResponse(res, job, 200, 'Job updated successfully');
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 400);
        }
    }

    // Delete job (Recruiter only - own jobs)
    async deleteJob(req: AuthRequest, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const recruiterId = req.user!.id;

            const job = await Job.findByPk(jobId);

            if (!job) {
                throw new NotFoundError('Job not found');
            }

            // Verify ownership
            if (job.getDataValue('recruiterId') !== recruiterId) {
                throw new ForbiddenError('You can only delete your own jobs');
            }

            await job.destroy();

            return successResponse(res, null, 200, 'Job deleted successfully');
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 400);
        }
    }
}

export const jobController = new JobController();
