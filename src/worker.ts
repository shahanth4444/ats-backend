import { Queue, Worker, Job } from 'bullmq';
import { emailService } from './services/email.service';
import { Application, User, Job as JobModel } from './models';

// 1. The Queue (Producer) - Used to add jobs
export const emailQueue = new Queue('email-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

interface EmailJobData {
  type: 'application_submitted' | 'status_changed' | 'new_application_for_recruiter';
  applicationId: number;
  recipientEmail?: string;
  recipientName?: string;
  jobTitle?: string;
  newStatus?: string;
}

// 2. The Worker (Consumer) - Used to process jobs
const worker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    console.log(`📧 [Worker] Processing job ${job.id}: ${job.data.type}`);

    try {
      // Fetch application details
      const application = await Application.findByPk(job.data.applicationId, {
        include: [
          { model: User, as: 'candidate' },
          { model: JobModel, include: [{ model: User, as: 'recruiter' }] }
        ]
      });

      if (!application) {
        throw new Error(`Application ${job.data.applicationId} not found`);
      }

      const candidate = (application as any).candidate;
      const jobData = (application as any).Job;
      const recruiter = jobData?.recruiter;

      // Send appropriate email based on type
      switch (job.data.type) {
        case 'application_submitted':
          await emailService.sendEmail({
            to: candidate.email,
            subject: `Application Submitted - ${jobData.title}`,
            html: emailService.applicationSubmittedTemplate(candidate.name, jobData.title)
          });
          break;

        case 'status_changed':
          await emailService.sendEmail({
            to: candidate.email,
            subject: `Application Status Update - ${jobData.title}`,
            html: emailService.statusChangedTemplate(
              candidate.name,
              jobData.title,
              job.data.newStatus || application.getDataValue('status')
            )
          });
          break;

        case 'new_application_for_recruiter':
          if (recruiter) {
            await emailService.sendEmail({
              to: recruiter.email,
              subject: `New Application - ${jobData.title}`,
              html: emailService.newApplicationForRecruiterTemplate(
                recruiter.name,
                candidate.name,
                jobData.title
              )
            });
          }
          break;
      }

      console.log(`✅ [Worker] Email sent successfully for job ${job.id}`);
    } catch (error: any) {
      console.error(`❌ [Worker] Error processing job ${job.id}:`, error.message);
      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    },
    // Note: Retry configuration is set per job when adding to queue
    // BullMQ handles retries automatically based on job configuration
  }
);

// Event handlers for better monitoring
worker.on('completed', (job) => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
  // In production, you might want to:
  // 1. Log to a monitoring service (e.g., Sentry)
  // 2. Move to a dead-letter queue
  // 3. Send an alert to administrators
});

worker.on('error', (err) => {
  console.error('❌ [Worker] Worker error:', err);
});

console.log('👷 Background Worker Started...');
console.log(`   - Queue: email-queue`);
console.log(`   - Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
console.log(`   - Retry attempts: 3`);
console.log(`   - Backoff: exponential (1s base)`);
