import { Router } from 'express';
import passport from 'passport';
import multer from 'multer';

import { UserController } from '../controllers/userController';
import { PassportConfig, authorize } from '../utils/passport';
import {
  validateResetPassword,
  validateUser,
  validateEditUser,
} from '../middleware/ValidationMiddleware/userValidation';
import storage from '../utils/multerStorage';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;

const passportConfig = new PassportConfig();
const upload = multer({ storage });

export class UserRoutes {
  router: Router;
  public userController: UserController = new UserController();

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post('/register', upload.single('picture'), validateUser, this.userController.registerUser);

    this.router.post('/login', this.userController.authenticateUser);

    this.router.get('/users', passportConfig.authenticateJwt, authorize([ADMIN]), this.userController.getAllUsers);

    this.router.post('/refresh-token', this.userController.refreshAccessToken);

    this.router.get('/users/:id', passportConfig.authenticateJwt, authorize([ADMIN]), this.userController.getUsersById);

    this.router.put(
      '/users/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      upload.single('picture'),
      validateUser,
      this.userController.updateUser,
    );

    this.router.delete(
      '/users/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.userController.deleteUser,
    );

    this.router.post('/reset-password', this.userController.resetPassword);

    this.router.post('/confirm-password-reset', validateResetPassword, this.userController.confirmPasswordReset);

    this.router.post(
      '/change-password',
      validateResetPassword,
      passportConfig.authenticateJwt,
      this.userController.changePassword,
    );

    this.router.put(
      '/edit-info',
      upload.single('picture'),
      validateEditUser,
      passportConfig.authenticateJwt,
      this.userController.editInfo,
    );

    this.router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', ''] }));

    this.router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      this.userController.googleLogin,
    );

    this.router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

    this.router.get(
      '/facebook/callback',
      passport.authenticate('facebook', { session: false, scope: ['email', 'public_profile'] }),
      this.userController.facebookLogin,
    );
  }
}
