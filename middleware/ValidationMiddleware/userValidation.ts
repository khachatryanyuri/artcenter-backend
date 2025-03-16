import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../utils/errors';
import { notEmptyObject } from './customCheckers';

export const validateUser = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    check('email').isEmail().normalizeEmail({
      gmail_remove_dots: false,
    }),
    check('password').isLength({ min: 8 }),
    check('name').custom(notEmptyObject),
    check('surname').custom(notEmptyObject),
    //TODO add when implement the shop
    // check('address').custom(notEmptyObject),
    check('phoneNumber').notEmpty(),
    check('birthday').isDate().notEmpty(),
  ];

  try {
    await Promise.all(validators.map((validator) => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array());
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [check('newPassword').isLength({ min: 8 })];

  try {
    await Promise.all(validators.map((validator) => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array());
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateEditUser = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    check('email').isEmail().normalizeEmail({
      gmail_remove_dots: false,
    }),
    check('password').isLength({ min: 8 }),
  ];

  try {
    await Promise.all(validators.map((validator) => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError(errors.array());
    }
    next();
  } catch (error) {
    next(error);
  }
};
