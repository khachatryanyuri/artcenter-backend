import { Router } from 'express';

import { LanguagesController } from '../controllers/languagesController';
import { PassportConfig, authorize } from '../utils/passport';
import { validateLanguage } from '../middleware/ValidationMiddleware/languageValidator';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;
const passportConfig = new PassportConfig();

export class LanguageRoutes {
  router: Router;
  public languagesController: LanguagesController = new LanguagesController();

  constructor() {
    this.router = Router();
    this.routes();
  }
  routes() {
    this.router.get('/languages', this.languagesController.getAllLanguages);

    this.router.post(
      '/languages',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateLanguage,
      this.languagesController.registerLanguage,
    );

    this.router.get(
      '/languages/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.languagesController.getLanguageById,
    );

    this.router.delete(
      '/languages/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.languagesController.deleteLanguage,
    );
  }
}
