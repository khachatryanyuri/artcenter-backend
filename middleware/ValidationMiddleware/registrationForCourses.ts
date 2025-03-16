import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../utils/errors';

export const validateRegistrationForCourses = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    check('id').notEmpty(),
    check('name').notEmpty(),
    check('surname').notEmpty(),
    check('email').notEmpty().isEmail(),
    check('phoneNumber').notEmpty(),
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
