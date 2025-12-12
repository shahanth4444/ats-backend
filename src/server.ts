import express from 'express';
import { sequelize, Job, Application } from './models'; // Import models
import './worker'; // Start Worker
import { register, login } from './controllers/auth.controller';
import { authenticateToken, requireRecruiter, AuthRequest } from './middleware/auth';
import { changeStatus } from './services/workflow.service';
import { emailQueue } from './worker';

const app = express();
app.use(express.json());

// --- AUTH ROUTES ---
app.post('/auth/register', register);
app.post('/auth/login', login);

// --- JOB ROUTES (Recruiter Only) ---
app.post('/jobs', authenticateToken, requireRecruiter, async (req: AuthRequest, res: express.Response) => {
  try {
    const { title, description } = req.body;
    // The Recruiter ID comes from the secure Token, not the body
    const recruiterId = req.user!.id; 
    
    const job = await Job.create({ title, description, recruiterId });
    res.status(201).json({ success: true, job });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- APPLICATION ROUTES (Candidate Only) ---
app.post('/jobs/:id/apply', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const candidateId = req.user!.id; // ID from Token

    // 1. Check if Job exists
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // 2. Create Application
    const application = await Application.create({ jobId, candidateId, status: 'applied' });

    // 3. Trigger Email (Async)
    await emailQueue.add('send-email', { appId: application.id, status: 'applied' });

    res.status(201).json({ success: true, application });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- WORKFLOW ROUTE (Recruiter Only) ---
app.patch('/applications/:id/status', authenticateToken, requireRecruiter, async (req: AuthRequest, res: express.Response) => {
  try {
    const appId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.user!.id; 

    const result = await changeStatus(appId, status, userId);
    res.json({ success: true, application: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3000;
sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database Ready');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});