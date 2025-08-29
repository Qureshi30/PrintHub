const nodemailer = require('nodemailer');

class EmailNotificationService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    // Only initialize if email credentials are provided
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ Email notification service initialized successfully');
    } else {
      console.log('📧 Email service not configured - notifications will be logged only');
    }
  }

  async sendNewPrintJobNotification(printJob, userEmail) {
    const subject = `New Print Job Submitted - ${printJob.file.originalName}`;
    const text = `
New print job has been submitted to PrintHub:

File: ${printJob.file.originalName}
User: ${userEmail}
Printer: ${printJob.printerId}
Status: ${printJob.status}
Pages: ${printJob.settings.pages}
Copies: ${printJob.settings.copies}
Color: ${printJob.settings.color ? 'Yes' : 'No'}
Total Cost: $${printJob.pricing.totalCost}

Please check the admin dashboard for more details.
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL || 'admin@printhub.com',
          subject,
          text,
        });
        console.log('📧 Admin notification email sent');
      } catch (error) {
        console.error('❌ Failed to send email notification:', error);
      }
    } else {
      // Log the notification instead
      console.log('📧 New Print Job Notification (Email not configured):');
      console.log(text);
    }
  }

  async sendJobStatusUpdateNotification(printJob, userEmail, oldStatus, newStatus) {
    const subject = `Print Job Status Update - ${printJob.file.originalName}`;
    const text = `
Your print job status has been updated:

File: ${printJob.file.originalName}
Status: ${oldStatus} → ${newStatus}
${newStatus === 'completed' ? 'Your print job is ready for pickup!' : ''}
${newStatus === 'failed' ? 'There was an issue with your print job. Please contact support.' : ''}

Check your PrintHub dashboard for more details.
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: userEmail,
          subject,
          text,
        });
        console.log('📧 Job status notification email sent');
      } catch (error) {
        console.error('❌ Failed to send status update email:', error);
      }
    } else {
      // Log the notification instead
      console.log('📧 Job Status Update Notification (Email not configured):');
      console.log(text);
    }
  }
}

module.exports = new EmailNotificationService();
