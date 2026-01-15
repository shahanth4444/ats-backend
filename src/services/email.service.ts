import dotenv from 'dotenv';

dotenv.config();

export interface EmailData {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    private fromEmail: string;

    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@ats-system.com';
    }

    async sendEmail(data: EmailData): Promise<void> {
        // In development, just log the email
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 [EmailService] Simulating email send:');
            console.log(`   To: ${data.to}`);
            console.log(`   Subject: ${data.subject}`);
            console.log(`   Body: ${data.html.substring(0, 100)}...`);
            return;
        }

        // In production, you would integrate with SendGrid or NodeMailer
        // Example with SendGrid:
        /*
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        await sgMail.send({
          to: data.to,
          from: this.fromEmail,
          subject: data.subject,
          html: data.html,
        });
        */

        // For now, simulate email sending
        console.log(`📧 [EmailService] Email sent to ${data.to}`);
    }

    // Email templates
    applicationSubmittedTemplate(candidateName: string, jobTitle: string): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Application Submitted Successfully</h2>
            <p>Dear ${candidateName},</p>
            <p>Thank you for applying to the position of <strong>${jobTitle}</strong>.</p>
            <p>Your application has been received and is currently under review. We will notify you of any updates regarding your application status.</p>
            <p>Best regards,<br>The Hiring Team</p>
          </div>
        </body>
      </html>
    `;
    }

    statusChangedTemplate(candidateName: string, jobTitle: string, newStatus: string): string {
        const statusMessages: Record<string, string> = {
            screening: 'Your application is being screened by our team.',
            interview: 'Congratulations! You have been selected for an interview.',
            offer: 'Great news! We would like to extend an offer to you.',
            hired: 'Congratulations! You have been hired!',
            rejected: 'Unfortunately, we have decided to move forward with other candidates.',
        };

        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Application Status Update</h2>
            <p>Dear ${candidateName},</p>
            <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
            <p><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
            <p>${statusMessages[newStatus] || 'Your application status has been updated.'}</p>
            <p>Best regards,<br>The Hiring Team</p>
          </div>
        </body>
      </html>
    `;
    }

    newApplicationForRecruiterTemplate(recruiterName: string, candidateName: string, jobTitle: string): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">New Application Received</h2>
            <p>Dear ${recruiterName},</p>
            <p>A new application has been submitted for the position of <strong>${jobTitle}</strong>.</p>
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p>Please review the application in the ATS system.</p>
            <p>Best regards,<br>ATS System</p>
          </div>
        </body>
      </html>
    `;
    }
}

export const emailService = new EmailService();
