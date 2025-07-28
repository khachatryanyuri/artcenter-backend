import { Router } from 'express';

import { authorize } from '../utils/passport';
import { PassportConfig } from '../utils/passport';

import { ROLE_ENUM } from '../interfaces/roleEnum';
import { validateMongooseId } from '../middleware/ValidationMiddleware/mongooseId';
import { ServicesApplicationController } from '../controllers/servicesApplicationController';
import { validateServicesApplication } from '../middleware/ValidationMiddleware/serviceApplicationValidation';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();

export class ServicesApplicationRoutes {
  router: Router;
  public servicesApplicationController: ServicesApplicationController = new ServicesApplicationController();
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/services-application-request',
      validateServicesApplication,
      this.servicesApplicationController.registerServicesApplication,
    );

    this.router.get(
      '/services-application-request',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.servicesApplicationController.getAllServicesApplication,
    );

    this.router.get(
      '/services-application-request/:id',
      passportConfig.authenticateJwt,
      validateMongooseId,
      authorize([ADMIN]),
      this.servicesApplicationController.getOneServicesApplication,
    );

    this.router.put(
      '/services-application-request/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateMongooseId,
      validateServicesApplication,
      this.servicesApplicationController.updateServicesApplication,
    );

    this.router.delete(
      '/services-application-request/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateMongooseId,
      this.servicesApplicationController.deleteServicesApplication,
    );
  }
}
