import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';

import { UserRoutes } from './routes/userRoutes';
import { CoursesRoutes } from './routes/coursesRoutes';
import { DB } from './utils/db';
import { Environment } from './utils/env';
import { PassportConfig } from './utils/passport';
import { errorHandler } from './middleware/errorHandler';
import MailService from './services/mailService';
import logger from './utils/logger';
import { LanguageRoutes } from './routes/languagesRoutes';
import { ContentRoutes } from './routes/contentRoutes';
import { SubTypesRoutes } from './routes/subTypes';
import { TypesRoutes } from './routes/types';

class Server {
  public app: express.Application;

  constructor() {
    this.app = express();
  }

  public routes(): void {
    this.app.use('/api/user', new UserRoutes().router);
    this.app.use('/api/', new LanguageRoutes().router);
    this.app.use('/api', new CoursesRoutes().router);
    this.app.use('/api', new ContentRoutes().router);
    this.app.use('/api', new SubTypesRoutes().router);
    this.app.use('/api', new TypesRoutes().router);
  }

  public async config(): Promise<void> {
    new PassportConfig();
    this.app.set('port', process.env.PORT || 3000);
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use('/api/static', express.static('./images'));
    this.app.use(
      cors({
        origin: '*',
        exposedHeaders: ['content-range', 'Access-Control-Allow-Origin'],
        credentials: true,
      }),
    );
    this.app.use(helmet());
    this.app.use(passport.initialize());

    const db = new DB();
    db.getConnection();

    logger.info('Connecting with SMTP Server...');
    const mailService = MailService.getInstance();
    if (Environment.env === 'local') {
      await mailService.createLocalConnection();
    } else if (Environment.env === 'production') {
      await mailService.createConnection();
    }
    logger.info('SMTP Server Connected');
    await mailService.verifyConnection();
    logger.info('SMTP Connection verified');
  }
  public errorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.app.get('port'), () => {
      logger.info(`API is running at http://localhost:${this.app.get('port')}`);
    });
  }
}

const server = new Server();
(async () => {
  await server.config();
  server.routes();
  server.errorHandling();
  server.start();
})();
