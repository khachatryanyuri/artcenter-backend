import Mail from 'nodemailer/lib/mailer';

export interface IMail {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: Mail.Attachment[];
}
