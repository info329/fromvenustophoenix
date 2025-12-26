import transporter from './config';
import { emailTemplates } from './templates';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || '',
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendReportReadyEmail(
  userEmail: string,
  userName: string,
  serviceName: string,
  reportUrl: string
): Promise<boolean> {
  const template = emailTemplates.reportReady(userName, serviceName, reportUrl);
  return sendEmail({
    to: userEmail,
    ...template,
  });
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<boolean> {
  const template = emailTemplates.welcomeEmail(userName);
  return sendEmail({
    to: userEmail,
    ...template,
  });
}
