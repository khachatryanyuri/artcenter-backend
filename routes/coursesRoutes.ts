import { Router } from 'express';
import multer from 'multer';

import { CoursesController } from '../controllers/coursesController';
import { authorize } from '../utils/passport';
import { PassportConfig } from '../utils/passport';
import { validateCourses } from '../middleware/ValidationMiddleware/coursesValidation';
import { validateRegistrationForCourses } from '../middleware/ValidationMiddleware/registrationForCourses';

import storage from '../utils/multerStorage';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();
const upload = multer({ storage });

export class CoursesRoutes {
  router: Router;
  public coursesController: CoursesController = new CoursesController();
  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/courses',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      validateCourses,
      this.coursesController.registerCourses,
    );

    this.router.get('/courses', this.coursesController.getAllCourses);

    this.router.get('/courses/:id', this.coursesController.getOneCourses);

    this.router.put(
      '/courses/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      validateCourses,
      this.coursesController.updateCourses,
    );

    this.router.delete(
      '/courses/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.coursesController.deleteCourses,
    );
  }
}
