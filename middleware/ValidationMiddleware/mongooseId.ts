import { param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { BadRequestError } from '../../utils/errors';

export const validateMongooseId = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    param('id').custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new BadRequestError('Invalid mongoose object id');
      }
      return true;
    }),
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
