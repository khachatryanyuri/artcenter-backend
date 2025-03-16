import nodemailer, { TransportOptions } from 'nodemailer';

import { IMail } from '../interfaces/mailInterface';
import { Environment } from '../utils/env';

export default class MailService {
  private static instance: MailService;
  private transporter!: nodemailer.Transporter;

  private constructor() {}

  static getInstance() {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  async createLocalConnection() {
    let account = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  }

  async createConnection() {
    this.transporter = nodemailer.createTransport({
      host: Environment.smtpHost,
      port: Environment.smtpPort,
      secure: Environment.smtpTLS === 'true' ? true : false,
      auth: {
        user: Environment.smtpUsername,
        pass: Environment.smtpPassword,
      },
      tls: { ciphers: 'SSLv3' },
    } as TransportOptions);
  }

  async sendMail(requestId: string | number | string[], options: IMail) {
    return await this.transporter
      .sendMail({
        from: `"Azatazen" ${Environment.smtpSender || options.from}`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      })
      .then((info) => {
        console.info(`${requestId} - Mail sent successfully!!`);
        console.info(`${requestId} - [MailResponse]=${info.response} [MessageID]=${info.messageId}`);
        if (Environment.env === 'local') {
          console.info(`${requestId} - Nodemailer ethereal URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return info;
      });
  }

  async verifyConnection() {
    return this.transporter.verify();
  }

  getTransporter() {
    return this.transporter;
  }
}
