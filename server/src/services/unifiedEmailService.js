const nodemailer = require('nodemailer');
require('dotenv').config();

class UnifiedEmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    // Only initialize if email credentials are provided
    if (process.env.EMAIL_USER && (process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS)) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // Preferred service
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS
        }
      });
      console.log('✅ Unified email service initialized successfully');
    } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Fallback to custom SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ Unified email service initialized with custom SMTP');
    } else {
      console.log('📧 Email service not configured - notifications will be logged only');
    }
  }

  // ADMIN NOTIFICATIONS
  async sendNewPrintJobNotification(printJob, userEmail) {
    const subject = `New Print Job Submitted - ${printJob.file?.originalName || printJob.fileName}`;
    const text = `
New print job has been submitted to PrintHub:

File: ${printJob.file?.originalName || printJob.fileName}
User: ${userEmail}
Printer: ${printJob.printerId}
Status: ${printJob.status}
Pages: ${printJob.settings?.pages || printJob.pageCount || printJob.pages}
Copies: ${printJob.settings?.copies || 1}
Color: ${printJob.settings?.color ? 'Yes' : 'No'}
Total Cost: ₹${printJob.pricing?.totalCost || printJob.estimatedCost}

Please check the admin dashboard for more details.
    `;

    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@printhub.com',
      subject,
      text,
      logMessage: '📧 Admin notification email sent'
    });
  }

  async sendJobStatusUpdateNotification(printJob, userEmail, oldStatus, newStatus) {
    const subject = `Print Job Status Update - ${printJob.file?.originalName || printJob.fileName}`;
    const text = `
Your print job status has been updated:

File: ${printJob.file?.originalName || printJob.fileName}
Status: ${oldStatus} → ${newStatus}
${newStatus === 'completed' ? 'Your print job is ready for pickup!' : ''}
${newStatus === 'failed' ? 'There was an issue with your print job. Please contact support.' : ''}

Check your PrintHub dashboard for more details.
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      text,
      logMessage: '📧 Job status notification email sent'
    });
  }

  // USER NOTIFICATIONS (Rich HTML)
  async sendPrintCompletionNotification(printJob) {
    try {
      const emailTemplate = this.generatePrintCompletionEmail(printJob);
      
      const mailOptions = {
        from: `"PrintHub System" <${process.env.EMAIL_USER}>`,
        to: printJob.userEmail,
        subject: `Print Job Completed - ${printJob.fileName}`,
        html: emailTemplate,
        text: this.generatePlainTextEmail(printJob)
      };

      if (this.transporter) {
        const result = await this.transporter.sendMail(mailOptions);
        console.log('📧 Print completion email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.log('📧 Print Completion Notification (Email not configured):');
        console.log(this.generatePlainTextEmail(printJob));
        return { success: false, error: 'Email not configured' };
      }
    } catch (error) {
      console.error('❌ Failed to send print completion email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPrintErrorNotification(printJob, errorMessage) {
    try {
      const mailOptions = {
        from: `"PrintHub System" <${process.env.EMAIL_USER}>`,
        to: printJob.userEmail,
        subject: `Print Job Failed - ${printJob.fileName}`,
        html: this.generateErrorEmail(printJob, errorMessage),
        text: `Print Job Failed\n\nYour print job for ${printJob.fileName} failed to complete.\nError: ${errorMessage}\n\nPlease try again or contact support.`
      };

      if (this.transporter) {
        const result = await this.transporter.sendMail(mailOptions);
        console.log('📧 Print error email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
      } else {
        console.log('📧 Print Error Notification (Email not configured):');
        console.log(mailOptions.text);
        return { success: false, error: 'Email not configured' };
      }
    } catch (error) {
      console.error('❌ Failed to send print error email:', error);
      return { success: false, error: error.message };
    }
  }

  // UTILITY METHODS
  async sendEmail({ to, subject, text, html, logMessage }) {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to,
          subject,
          text,
          html
        });
        console.log(logMessage || '📧 Email sent successfully');
        return { success: true };
      } catch (error) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.log('📧 Email Notification (Email not configured):');
      console.log(text);
      return { success: false, error: 'Email not configured' };
    }
  }

  generatePrintCompletionEmail(printJob) {
    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleString('en-IN');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #22c55e, #3b82f6); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .job-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .success-badge { background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; }
            .footer { text-align: center; padding: 15px; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🖨️ Print Job Completed!</h1>
                <span class="success-badge">Ready for Collection</span>
            </div>
            
            <div class="content">
                <h2>Hello ${printJob.userName || 'Student'},</h2>
                <p>Your print job has been successfully completed and is ready for collection.</p>
                
                <div class="job-details">
                    <h3>📄 Job Details</h3>
                    <p><strong>File Name:</strong> ${printJob.fileName}</p>
                    <p><strong>Pages Printed:</strong> ${printJob.pageCount || printJob.pages} pages</p>
                    <p><strong>Printer Used:</strong> ${printJob.printerName}</p>
                    <p><strong>Print Quality:</strong> ${printJob.printSettings?.quality || 'Standard'}</p>
                    <p><strong>Color Mode:</strong> ${printJob.printSettings?.colorMode || 'Black & White'}</p>
                    <p><strong>Completed At:</strong> ${formatDate(new Date())}</p>
                </div>

                <div class="job-details">
                    <h3>💰 Cost Breakdown</h3>
                    <p><strong>Base Cost:</strong> ${formatCurrency((printJob.estimatedCost || 0) * 0.8)}</p>
                    <p><strong>Service Fee:</strong> ${formatCurrency((printJob.estimatedCost || 0) * 0.2)}</p>
                    <p><strong>Total Amount:</strong> ${formatCurrency(printJob.estimatedCost || 0)}</p>
                </div>

                <div class="job-details">
                    <h3>📍 Collection Information</h3>
                    <p><strong>Location:</strong> ${this.getPrinterLocation(printJob.printerId)}</p>
                    <p><strong>Job ID:</strong> <code>${printJob.jobId || printJob._id}</code></p>
                    <p><strong>Valid Until:</strong> ${formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}</p>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4>⚠️ Important Notes:</h4>
                    <ul>
                        <li>Please collect your documents within 24 hours</li>
                        <li>Bring your student ID for verification</li>
                        <li>Reference your Job ID when picking up</li>
                        <li>Uncollected jobs will be securely disposed after 24 hours</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>PrintHub - Smart Campus Printing Solution</p>
                <p>Need help? Contact support at printhub@college.edu</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  generatePlainTextEmail(printJob) {
    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleString('en-IN');

    return `
PrintHub - Print Job Completed!

Hello ${printJob.userName || 'Student'},

Your print job has been successfully completed and is ready for collection.

Job Details:
- File Name: ${printJob.fileName}
- Pages Printed: ${printJob.pageCount || printJob.pages} pages
- Printer Used: ${printJob.printerName}
- Total Cost: ${formatCurrency(printJob.estimatedCost || 0)}
- Completed At: ${formatDate(new Date())}

Collection Information:
- Location: ${this.getPrinterLocation(printJob.printerId)}
- Job ID: ${printJob.jobId || printJob._id}
- Valid Until: ${formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}

Important Notes:
- Please collect your documents within 24 hours
- Bring your student ID for verification
- Reference your Job ID when picking up
- Uncollected jobs will be securely disposed after 24 hours

PrintHub - Smart Campus Printing Solution
Need help? Contact support at printhub@college.edu
    `;
  }

  generateErrorEmail(printJob, errorMessage) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .error-details { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>❌ Print Job Failed</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${printJob.userName || 'Student'},</h2>
                <p>Unfortunately, your print job could not be completed.</p>
                
                <div class="error-details">
                    <h3>Error Details</h3>
                    <p><strong>File:</strong> ${printJob.fileName}</p>
                    <p><strong>Error:</strong> ${errorMessage}</p>
                    <p><strong>Attempted At:</strong> ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <p>Please try submitting your print job again, or contact support if the problem persists.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getPrinterLocation(printerId) {
    const locations = {
      'hp-laserjet-m201': 'Main Library - Ground Floor',
      'microsoft-pdf': 'Digital Download - Check your email attachments',
      'hp-laserjet-backup': 'Computer Lab - Engineering Block',
      'hp-laserjet-admin': 'Administrative Office'
    };
    return locations[printerId] || 'Check printer selection for location';
  }
}

module.exports = new UnifiedEmailService();