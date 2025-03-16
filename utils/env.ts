import logger from '../utils/logger';

export class Environment {
  private static getVariable(name: string, defaultValue?: string): string {
    const value = process.env[name];

    if (value !== undefined && value !== '') {
      return value;
    }

    if (defaultValue !== undefined) {
      logger.warn(`Environment variable '${name}' is missing. Using default: ${defaultValue}`);
      return defaultValue;
    }

    logger.error(`Critical environment variable '${name}' is missing. Exiting...`);
    process.exit(1);
  }

  static mongoUri: string = this.getVariable('MONGODB_URI');
  static jwtSecret: string = this.getVariable('JWT_SECRET');
  static jwtSecretRefresh: string = this.getVariable('JWT_SECRET_REFRESH');
  static port: string = this.getVariable('PORT');
  static EXPIRES_IN_ACCESS: string = this.getVariable('EXPIRES_IN_ACCESS');
  static EXPIRES_IN_REFRESH: string = this.getVariable('EXPIRES_IN_REFRESH');
  static smtpHost: string = this.getVariable('SMTP_HOST');
  static smtpPort: string = this.getVariable('SMTP_PORT');
  static smtpTLS: string = this.getVariable('SMTP_TLS');
  static smtpUsername: string = this.getVariable('SMTP_USERNAME');
  static smtpPassword: string = this.getVariable('SMTP_PASSWORD');
  static smtpSender: string = this.getVariable('SMTP_SENDER');
  static env: string = this.getVariable('NODE_ENV');
  static merchantId: string = this.getVariable('MERCHANT_ID');
  static merchantUsername: string = this.getVariable('MERCHANT_USERNAME');
  static merchantPassword: string = this.getVariable('MERCHANT_PASSWORD');
  static merchantIsTest: string = this.getVariable('MERCHANT_IS_TEST');
  static resetLink: string = this.getVariable('RESET_LINK');
  static dbBaseDelayMs: string | number = this.getVariable('MONGO_BASE_DELAY_MS') || 1000;
  static dbMaxDelayMs: string | number = this.getVariable('MONGO_MAX_DELAY_MS') || 30000;
  static dbMaxRetries: string | number = this.getVariable('MAX_RETRIES') || 5;
  static googleClientID: string = this.getVariable('GOOGLE_CLIENT_ID');
  static googleClientSecret: string = this.getVariable('GOOGLE_CLIENT_SECRET');
  static googleCallbackURL: string = this.getVariable('GOOGLE_CLIENT_CALLBACK_URL');
  static facebookClientID: string = this.getVariable('FACEBOOK_CLIENT_ID');
  static facebookClientSecret: string = this.getVariable('FACEBOOK_CLIENT_SECRET');
  static facebookCallbackURL: string = this.getVariable('FACEBOOK_CLIENT_CALLBACK_URL');
  static staticFilePath: string = this.getVariable('STATIC_FILE_PATH');
  static redirectPage: string = this.getVariable('REDIRECT_PAGE');
}
