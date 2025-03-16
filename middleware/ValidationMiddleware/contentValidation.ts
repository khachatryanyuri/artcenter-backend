import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../utils/errors';
import { hyNotEmpty, uniqueContentKey } from './customCheckers';

export const validateContent = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const validators = [
    check('page').notEmpty(),
    check('key')
      .notEmpty()
      .custom((value: string) => uniqueContentKey(value, id)),
    // check('title').custom(hyNotEmpty),
    // check('description').custom(hyNotEmpty),
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
