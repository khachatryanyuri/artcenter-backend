import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../utils/errors';

export const validateServicesApplication = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    check('fieldOfService')
      .notEmpty()
      .withMessage('Field of service is required.')
      .isString()
      .withMessage('Field of service must be a string.'),

    check('wishes').optional().isString().withMessage('Wishes must be a string.'),

    check('deadline')
      .notEmpty()
      .withMessage('Deadline is required.')
      .isISO8601()
      .toDate()
      .withMessage('Deadline must be a valid ISO 8601 date.'),

    check('name').notEmpty().withMessage('Name is required.').isString().withMessage('Name must be a string.'),

    check('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Email must be valid.'),

    check('skype').optional().isString().withMessage('Skype must be a string.'),

    check('whatsapp').optional().isString().withMessage('WhatsApp must be a string.'),

    check('telegram').optional().isString().withMessage('Telegram must be a string.'),
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
