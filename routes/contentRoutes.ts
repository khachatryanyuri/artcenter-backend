import { Router } from 'express';

import { PassportConfig, authorize } from '../utils/passport';
import { ROLE_ENUM } from '../interfaces/roleEnum';
import { ContentController } from '../controllers/contentController';
import { validateContent } from '../middleware/ValidationMiddleware/contentValidation';

const { ADMIN } = ROLE_ENUM;
const passportConfig = new PassportConfig();

export class ContentRoutes {
  router: Router;
  public contentController: ContentController = new ContentController();

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.get('/content', this.contentController.getAllContent);

    this.router.post(
      '/content',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateContent,
      this.contentController.createContent,
    );

    this.router.put(
      '/content/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateContent,
      this.contentController.updateContent,
    );

    this.router.get(
      '/content/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.contentController.getOneContent,
    );

    this.router.delete(
      '/content/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.contentController.deleteContent,
    );

    this.router.get('/pages', this.contentController.getAllPages);
  }
}
