import { Response } from 'express';
import { Application, Job, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse, calculatePagination } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { emailQueue } from '../worker';

export class ApplicationController {
    // Submit application (Candidate only)
    async applyToJob(req: AuthRequest, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const candidateId = req.user!.id;

            // Check if job exists
            const job = await Job.findByPk(jobId, {
                include: [{ model: User, as: 'recruiter' }]
            });

            if (!job) {
                throw new NotFoundError('Job not found');
            }

            // Check if job is open
            if (job.getDataValue('status') !== 'open') {
                throw new ForbiddenError('This job is no longer accepting applications');
            }

            // Check if already applied
            const existingApplication = await Application.findOne({
                where: { jobId, candidateId }
            });

            if (existingApplication) {
                throw new ForbiddenError('You have already applied to this job');
            }

            // Create application
            const application = await Application.create({
                jobId,
                candidateId,
                status: 'applied'
            });

            // Queue email notifications (async)
            try {
                // Notify candidate
                await emailQueue.add('send-email', {
                    type: 'application_submitted',
                    applicationId: application.id
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 }
                });

                // Notify recruiter
                await emailQueue.add('send-email', {
                    type: 'new_application_for_recruiter',
                    applicationId: application.id
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 }
                });

                console.log(`📧 Email notifications queued for application #${application.id}`);
            } catch (emailError: any) {
                console.error('Failed to queue email notifications:', emailError.message);
            }

            return successResponse(res, application, 201, 'Application submitted successfully');
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 400);
        }
    }

    // Get single application by ID (with RBAC)
    async getApplicationById(req: AuthRequest, res: Response) {
        try {
            const applicationId = parseInt(req.params.id);
            const userId = req.user!.id;
            const userRole = req.user!.role;

            const application = await Application.findByPk(applicationId, {
                include: [
                    { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] },
                    {
                        model: Job,
                        include: [
                            { model: User, as: 'recruiter', attributes: ['id', 'name', 'email'] }
                        ]
                    }
                ]
            });

            if (!application) {
                throw new NotFoundError('Application not found');
            }

            // Authorization check
            const candidateId = application.getDataValue('candidateId');
            const job = (application as any).Job;
            const recruiterId = job?.recruiterId;

            const isCandidate = candidateId === userId;
            const isRecruiter = recruiterId === userId;
            const isHiringManager = userRole === 'hiring_manager'; // Simplified: can view all

            if (!isCandidate && !isRecruiter && !isHiringManager) {
                throw new ForbiddenError('You do not have permission to view this application');
            }

            return successResponse(res, application);
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    }

    // Get candidate's own applications
    async getMyCandidateApplications(req: AuthRequest, res: Response) {
        try {
            const candidateId = req.user!.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await Application.findAndCountAll({
                where: { candidateId },
                limit,
                offset,
                include: [
                    {
                        model: Job,
                        attributes: ['id', 'title', 'description', 'status'],
                        include: [
                            { model: User, as: 'recruiter', attributes: ['id', 'name', 'email'] }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            const pagination = calculatePagination(page, limit, count);
            return paginatedResponse(res, rows, pagination);
        } catch (error: any) {
            return errorResponse(res, error.message, 500);
        }
    }

    // Get all applications for a specific job (Recruiter/HM only)
    async getJobApplications(req: AuthRequest, res: Response) {
        try {
            const jobId = parseInt(req.params.id);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status as string;
            const offset = (page - 1) * limit;

            // Verify job exists and user has access
            const job = await Job.findByPk(jobId);
            if (!job) {
                throw new NotFoundError('Job not found');
            }

            // For recruiters, verify they own the job
            if (req.user!.role === 'recruiter' && job.getDataValue('recruiterId') !== req.user!.id) {
                throw new ForbiddenError('You can only view applications for your own jobs');
            }

            const where: any = { jobId };
            if (status) where.status = status;

            const { count, rows } = await Application.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            const pagination = calculatePagination(page, limit, count);
            return paginatedResponse(res, rows, pagination);
        } catch (error: any) {
            return errorResponse(res, error.message, error.statusCode || 500);
        }
    }
}

export const applicationController = new ApplicationController();
