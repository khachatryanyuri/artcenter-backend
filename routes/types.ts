import { Router } from 'express';
import multer from 'multer';

import { TypesController } from '../controllers/typesController';
import { authorize } from '../utils/passport';
import { PassportConfig } from '../utils/passport';

import storage from '../utils/multerStorage';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();
const upload = multer({ storage });

export class TypesRoutes {
  router: Router;
  public typesController: TypesController = new TypesController();
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/types',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      this.typesController.registerTypes,
    );

    this.router.get('/types', this.typesController.getAllTypes);

    this.router.get('/types/:id', this.typesController.getOneTypes);

    this.router.put(
      '/types/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      this.typesController.updateTypes,
    );

    this.router.delete(
      '/types/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.typesController.deleteTypes,
    );
  }
}
