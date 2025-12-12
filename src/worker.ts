import { Queue, Worker } from 'bullmq';

// 1. The Queue (Producer) - Used to add jobs
export const emailQueue = new Queue('email-queue', {
  connection: { host: 'localhost', port: 6379 }
});

// 2. The Worker (Consumer) - Used to process jobs
const worker = new Worker('email-queue', async (job) => {
  console.log(`📧 [Worker] Processing job ${job.id}: Sending email to candidate about "${job.data.status}"...`);
  
  // Simulate 2-second delay like a real email server
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`✅ [Worker] Email sent successfully for Application #${job.data.appId}!`);
}, {
  connection: { host: 'localhost', port: 6379 }
});

console.log("👷 Background Worker Started...");