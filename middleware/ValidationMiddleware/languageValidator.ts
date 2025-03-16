import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../utils/errors';
import { uniqueCode } from './customCheckers';

export const validateLanguage = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [check('code').custom(uniqueCode)];

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
