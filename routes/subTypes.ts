import { Router } from 'express';
import multer from 'multer';

import { SubTypesController } from '../controllers/subTypesController';
import { authorize } from '../utils/passport';
import { PassportConfig } from '../utils/passport';

import storage from '../utils/multerStorage';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();
const upload = multer({ storage });

export class SubTypesRoutes {
  router: Router;
  public subTypesController: SubTypesController = new SubTypesController();
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/subTypes',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      this.subTypesController.registerSubTypes,
    );

    this.router.get('/subTypes', this.subTypesController.getAllSubTypes);

    this.router.get('/subTypes/:id', this.subTypesController.getOneSubTypes);

    this.router.put(
      '/subTypes/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      this.subTypesController.updateSubTypes,
    );

    this.router.delete(
      '/subTypes/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.subTypesController.deleteSubTypes,
    );
  }
}
