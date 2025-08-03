import { Router } from 'express';
import multer from 'multer';

import { CoursesController } from '../controllers/coursesController';
import { authorize } from '../utils/passport';
import { PassportConfig } from '../utils/passport';
import { validateCourses } from '../middleware/ValidationMiddleware/coursesValidation';
import { validateRegistrationForCourses } from '../middleware/ValidationMiddleware/registrationForCourses';

import storage from '../utils/multerStorage';
import { ROLE_ENUM } from '../interfaces/roleEnum';
import { CoursesApplicationController } from '../controllers/coursesApplicationController';
import { validateMongooseId } from '../middleware/ValidationMiddleware/mongooseId';
import { validateCourseApplication } from '../middleware/ValidationMiddleware/courseApplicationValidation';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();
const upload = multer({ storage });

export class CoursesApplicationRoutes {
  router: Router;
  public coursesApplicationController: CoursesApplicationController = new CoursesApplicationController();
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/courses-application-request',
      validateCourseApplication,
      this.coursesApplicationController.registerCoursesApplication,
    );

    this.router.get(
      '/courses-application-request',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.coursesApplicationController.getAllCoursesApplication,
    );

    this.router.get(
      '/courses-application-request/:id',
      passportConfig.authenticateJwt,
      validateMongooseId,
      authorize([ADMIN]),
      this.coursesApplicationController.getOneCoursesApplication,
    );

    this.router.put(
      '/courses-application-request/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateMongooseId,
      validateCourseApplication,
      this.coursesApplicationController.updateCoursesApplication,
    );

    this.router.delete(
      '/courses-application-request/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      validateMongooseId,
      this.coursesApplicationController.deleteCoursesApplication,
    );
  }
}
