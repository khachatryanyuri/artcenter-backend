import { NextFunction, Request, Response } from 'express';

import { UserService } from '../services/userService';
import { User } from '../models/userModel';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/errors';
import passportConfig from '../utils/passport';
import { Environment } from '../utils/env';

const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';
const userService = new UserService();

export class UserController {
  public async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.registerUser(req.body, req.file?.path ?? '');
      res.status(201).json({ message: 'User registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: User registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.authenticateUser(req.body);
      const token = passportConfig.generateToken(user, ACCESS_TOKEN_TYPE);
      const refreshToken = passportConfig.generateToken(user, REFRESH_TOKEN_TYPE);
      res.json({ message: 'Authentication successful', user, token, refreshToken });
      logger.info(`Status Code: ${res.statusCode} - Message: Authentication successful`);
    } catch (error) {
      next(error);
    }
  }

  public async refreshAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const user = await userService.refreshAccessToken(refreshToken);
      const response = {
        token: passportConfig.generateToken(user, ACCESS_TOKEN_TYPE),
        refreshToken: passportConfig.generateToken(user, REFRESH_TOKEN_TYPE),
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers(req.query);
      const totalCount = await User.countDocuments();
      res.status(200).json({ data: users, total: totalCount });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Users successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getUsersById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await userService.getUsersById(userId);
      res.json(user);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Users successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      let updatedUser = await userService.updateUser(userId, req.body, req.file?.path ?? '');
      res.json(updatedUser);
      logger.info(`Status Code: ${res.statusCode} - Message: User update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id;
      await userService.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: User delete was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await userService.resetPassword(email);
      res.json({ message: 'Password reset email sent successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Password reset email sent successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;
      await userService.confirmPasswordReset(resetToken, newPassword);
      res.json({ message: 'Password reset successful' });
      logger.info(`Status Code: ${res.statusCode} - Message: Password reset successful`);
    } catch (error) {
      next(error);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const userInfo = req.user;

      const isPasswordValid = await userService.checkUserPassword(userInfo, currentPassword);
      if (!isPasswordValid) {
        throw new BadRequestError('Invalid current password');
      }

      await userService.changeUserPassword(userInfo, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
  public async editInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const editData = req.body;

      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const userInfo = req.user;

      const updatedUser = await userService.editInfo(userInfo, editData, req.file?.path ?? '');

      res.json(updatedUser);
      logger.info(`Status Code: ${res.statusCode} - Message: User update was successful`);
    } catch (error) {
      next(error);
    }
  }
  public async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.googleLogin(req.user);

      const token = passportConfig.generateToken(user, ACCESS_TOKEN_TYPE);

      const refreshToken = passportConfig.generateToken(user, REFRESH_TOKEN_TYPE);

      res.cookie('auth', JSON.stringify({ message: 'Authentication successful', user, token, refreshToken }), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      res.redirect(Environment.redirectPage);
      logger.info(`Status Code: ${res.statusCode} - Message: User update was successful`);
    } catch (error) {
      next(error);
    }
  }
  public async facebookLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.facebookLogin(req.user);

      const token = passportConfig.generateToken(user, ACCESS_TOKEN_TYPE);

      const refreshToken = passportConfig.generateToken(user, REFRESH_TOKEN_TYPE);

      res.cookie('auth', JSON.stringify({ message: 'Authentication successful', user, token, refreshToken }), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      res.redirect(Environment.redirectPage);
      logger.info(`Status Code: ${res.statusCode} - Message: User update was successful`);
    } catch (error) {
      next(error);
    }
  }
}
