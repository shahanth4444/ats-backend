import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import './worker'; // Start background worker
import { validationResult } from 'express-validator';

// Import controllers
import { register, login } from './controllers/auth.controller';
import { jobController } from './controllers/job.controller';
import { applicationController } from './controllers/application.controller';

// Import middleware
import {
  authenticateToken,
  requireRecruiter,
  requireCandidate,
  requireRecruiterOrHiringManager,
  AuthRequest
} from './middleware/auth';
import { errorHandler, asyncHandler } from './middleware/errorHandler';
import {
  registerValidation,
  loginValidation,
  createJobValidation,
  updateJobValidation,
  getJobValidation,
  applyJobValidation,
  changeStatusValidation,
  getApplicationValidation,
  paginationValidation,
  applicationFilterValidation
} from './middleware/validation';

// Import services
import { changeStatus } from './services/workflow.service';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Validation middleware helper
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ATS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== AUTH ROUTES ====================
app.post('/api/v1/auth/register', registerValidation, validate, asyncHandler(register));
app.post('/api/v1/auth/login', loginValidation, validate, asyncHandler(login));

// ==================== JOB ROUTES ====================
// Create job (Recruiter only)
app.post(
  '/api/v1/jobs',
  authenticateToken,
  requireRecruiter,
  createJobValidation,
  validate,
  asyncHandler(jobController.createJob.bind(jobController))
);

// Get all jobs (Public/Authenticated)
app.get(
  '/api/v1/jobs',
  paginationValidation,
  validate,
  asyncHandler(jobController.getAllJobs.bind(jobController))
);

// Get single job
app.get(
  '/api/v1/jobs/:id',
  getJobValidation,
  validate,
  asyncHandler(jobController.getJobById.bind(jobController))
);

// Update job (Recruiter only - own jobs)
app.put(
  '/api/v1/jobs/:id',
  authenticateToken,
  requireRecruiter,
  updateJobValidation,
  validate,
  asyncHandler(jobController.updateJob.bind(jobController))
);

// Delete job (Recruiter only - own jobs)
app.delete(
  '/api/v1/jobs/:id',
  authenticateToken,
  requireRecruiter,
  getJobValidation,
  validate,
  asyncHandler(jobController.deleteJob.bind(jobController))
);

// ==================== APPLICATION ROUTES ====================
// Apply to job (Candidate only)
app.post(
  '/api/v1/jobs/:id/apply',
  authenticateToken,
  requireCandidate,
  applyJobValidation,
  validate,
  asyncHandler(applicationController.applyToJob.bind(applicationController))
);

// Get applications for a specific job (Recruiter/HM only)
app.get(
  '/api/v1/jobs/:id/applications',
  authenticateToken,
  requireRecruiterOrHiringManager,
  paginationValidation,
  applicationFilterValidation,
  validate,
  asyncHandler(applicationController.getJobApplications.bind(applicationController))
);

// Get single application (Candidate/Recruiter/HM with proper authorization)
app.get(
  '/api/v1/applications/:id',
  authenticateToken,
  getApplicationValidation,
  validate,
  asyncHandler(applicationController.getApplicationById.bind(applicationController))
);

// Get candidate's own applications
app.get(
  '/api/v1/applications/me',
  authenticateToken,
  requireCandidate,
  paginationValidation,
  validate,
  asyncHandler(applicationController.getMyCandidateApplications.bind(applicationController))
);

// Change application status (Recruiter only)
app.patch(
  '/api/v1/applications/:id/status',
  authenticateToken,
  requireRecruiter,
  changeStatusValidation,
  validate,
  asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const appId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user!.id;

    const result = await changeStatus(appId, status, userId);
    res.json({ success: true, application: result });
  })
);

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database connected and synced');
  console.log(`   - Database: ${process.env.DB_NAME}`);
  console.log(`   - Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  app.listen(PORT, () => {
    console.log(`🚀 ATS Backend API Server running`);
    console.log(`   - Port: ${PORT}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - API Version: v1`);
    console.log(`   - Health Check: http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
});

export default app;