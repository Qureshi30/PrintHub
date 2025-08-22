// Email templates for PrintHub notifications

export interface PrintJobCompleteData {
  userFirstName: string;
  userEmail: string;
  jobId: string;
  fileName: string;
  pages: number;
  copies: number;
  totalCost: number;
  printerLocation: string;
  completedAt: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const printJobCompleteTemplate = (data: PrintJobCompleteData): EmailTemplate => {
  const subject = `Print Job ${data.jobId} Ready for Collection - PrintHub`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Print Job Complete</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .success-badge { background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
        .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .location-highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖨️ PrintHub</h1>
          <h2>Your Print Job is Ready!</h2>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ COMPLETED</div>
          
          <p>Hi ${data.userFirstName},</p>
          
          <p>Great news! Your print job has been completed successfully and is ready for collection.</p>
          
          <div class="job-details">
            <h3>📋 Job Details</h3>
            <div class="detail-row">
              <span><strong>Job ID:</strong></span>
              <span>${data.jobId}</span>
            </div>
            <div class="detail-row">
              <span><strong>File Name:</strong></span>
              <span>${data.fileName}</span>
            </div>
            <div class="detail-row">
              <span><strong>Pages:</strong></span>
              <span>${data.pages}</span>
            </div>
            <div class="detail-row">
              <span><strong>Copies:</strong></span>
              <span>${data.copies}</span>
            </div>
            <div class="detail-row">
              <span><strong>Total Cost:</strong></span>
              <span>$${data.totalCost.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span><strong>Completed At:</strong></span>
              <span>${data.completedAt}</span>
            </div>
          </div>
          
          <div class="location-highlight">
            <h3>📍 Collection Location</h3>
            <p><strong>${data.printerLocation}</strong></p>
            <p>Please bring a valid student ID for collection.</p>
          </div>
          
          <p><strong>Important:</strong> Please collect your documents within 24 hours. Uncollected prints may be disposed of after this period.</p>
          
          <a href="${window.location.origin}/queue" class="button">Track Your Jobs</a>
          
          <p>Thank you for using PrintHub!</p>
          
          <div class="footer">
            <p>This is an automated notification from PrintHub.<br>
            If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
PrintHub - Print Job Complete

Hi ${data.userFirstName},

Your print job has been completed successfully and is ready for collection.

Job Details:
- Job ID: ${data.jobId}
- File Name: ${data.fileName}
- Pages: ${data.pages}
- Copies: ${data.copies}
- Total Cost: $${data.totalCost.toFixed(2)}
- Completed At: ${data.completedAt}

Collection Location: ${data.printerLocation}

Please bring a valid student ID for collection.
Important: Please collect your documents within 24 hours.

Thank you for using PrintHub!

Track your jobs: ${window.location.origin}/queue
  `;
  
  return { subject, html, text };
};

export const printJobFailedTemplate = (data: Partial<PrintJobCompleteData> & { reason: string }): EmailTemplate => {
  const subject = `Print Job ${data.jobId} Failed - PrintHub`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Print Job Failed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .error-badge { background: #dc3545; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
        .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🖨️ PrintHub</h1>
          <h2>Print Job Failed</h2>
        </div>
        
        <div class="content">
          <div class="error-badge">❌ FAILED</div>
          
          <p>Hi ${data.userFirstName},</p>
          
          <p>We're sorry to inform you that your print job could not be completed.</p>
          
          <div class="job-details">
            <h3>📋 Job Details</h3>
            <p><strong>Job ID:</strong> ${data.jobId}</p>
            <p><strong>File Name:</strong> ${data.fileName}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
          
          <p>Your payment will be refunded automatically within 3-5 business days.</p>
          
          <a href="${window.location.origin}/upload" class="button">Try Again</a>
          
          <p>If you continue to experience issues, please contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated notification from PrintHub.<br>
            If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
PrintHub - Print Job Failed

Hi ${data.userFirstName},

We're sorry to inform you that your print job could not be completed.

Job Details:
- Job ID: ${data.jobId}
- File Name: ${data.fileName}
- Reason: ${data.reason}

Your payment will be refunded automatically within 3-5 business days.

If you continue to experience issues, please contact our support team.

Try again: ${window.location.origin}/upload
  `;
  
  return { subject, html, text };
};