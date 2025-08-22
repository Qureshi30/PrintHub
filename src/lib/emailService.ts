import emailjs from '@emailjs/browser';
import { printJobCompleteTemplate, printJobFailedTemplate, PrintJobCompleteData } from './emailTemplates';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key',
};

class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // Check if EmailJS is properly configured
    this.isConfigured = !!(
      EMAILJS_CONFIG.SERVICE_ID !== 'your_service_id' &&
      EMAILJS_CONFIG.TEMPLATE_ID !== 'your_template_id' &&
      EMAILJS_CONFIG.PUBLIC_KEY !== 'your_public_key'
    );

    if (this.isConfigured) {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      console.log('✅ EmailJS initialized successfully');
    } else {
      console.warn('⚠️ EmailJS not configured. Please set up environment variables.');
    }
  }

  async sendPrintJobCompleteNotification(data: PrintJobCompleteData): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email would be sent to:', data.userEmail);
      console.log('🔔 Print job complete notification (EmailJS not configured)');
      return true; // Return true for development
    }

    try {
      const template = printJobCompleteTemplate(data);
      
      const emailParams = {
        to_email: data.userEmail,
        to_name: data.userFirstName,
        subject: template.subject,
        html_content: template.html,
        text_content: template.text,
        job_id: data.jobId,
        file_name: data.fileName,
        printer_location: data.printerLocation,
        completion_time: data.completedAt,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        emailParams
      );

      if (response.status === 200) {
        console.log('✅ Print job completion email sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send email:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending print job completion email:', error);
      return false;
    }
  }

  async sendPrintJobFailedNotification(
    data: Partial<PrintJobCompleteData> & { reason: string }
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email would be sent to:', data.userEmail);
      console.log('🔔 Print job failed notification (EmailJS not configured)');
      return true;
    }

    try {
      const template = printJobFailedTemplate(data);
      
      const emailParams = {
        to_email: data.userEmail,
        to_name: data.userFirstName,
        subject: template.subject,
        html_content: template.html,
        text_content: template.text,
        job_id: data.jobId,
        file_name: data.fileName,
        failure_reason: data.reason,
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        emailParams
      );

      if (response.status === 200) {
        console.log('✅ Print job failed email sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send email:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending print job failed email:', error);
      return false;
    }
  }

  // Test function to verify email service is working
  async testEmailService(testEmail: string): Promise<boolean> {
    const testData: PrintJobCompleteData = {
      userFirstName: 'Test User',
      userEmail: testEmail,
      jobId: 'TEST-001',
      fileName: 'test-document.pdf',
      pages: 5,
      copies: 1,
      totalCost: 0.50,
      printerLocation: 'Library - Ground Floor',
      completedAt: new Date().toLocaleString(),
    };

    return await this.sendPrintJobCompleteNotification(testData);
  }

  // Check if email service is properly configured
  isEmailServiceConfigured(): boolean {
    return this.isConfigured;
  }

  // Get configuration status for admin panel
  getConfigurationStatus() {
    return {
      configured: this.isConfigured,
      serviceId: EMAILJS_CONFIG.SERVICE_ID !== 'your_service_id',
      templateId: EMAILJS_CONFIG.TEMPLATE_ID !== 'your_template_id',
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY !== 'your_public_key',
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
