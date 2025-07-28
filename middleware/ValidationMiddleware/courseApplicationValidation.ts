import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../utils/errors';

export const validateCourseApplication = async (req: Request, res: Response, next: NextFunction) => {
  const validators = [
    check('count')
      .notEmpty()
      .withMessage('Count is required.')
      .isInt({ min: 1 })
      .withMessage('Count must be a positive integer.'),

    check('persons').isArray({ min: 1 }).withMessage('At least one person is required.'),

    check('persons.*.name')
      .notEmpty()
      .withMessage('Name is required for each person.')
      .isString()
      .withMessage('Name must be a string.'),

    check('persons.*.age')
      .notEmpty()
      .withMessage('Age is required for each person.')
      .isInt({ min: 0 })
      .withMessage('Age must be a non-negative integer.'),

    check('location').notEmpty().withMessage('Location is required.'),

    check('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Email must be valid.'),

    check('skype').optional().isString().withMessage('Skype must be a string.'),

    check('whatsapp').optional().isString().withMessage('WhatsApp must be a string.'),

    check('fieldOfStudy').notEmpty().withMessage('Field of study is required.'),

    check('skillLevel').notEmpty().withMessage('Skill level is required.'),

    check('wishes').optional().isString().withMessage('Wishes must be a string.'),
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
