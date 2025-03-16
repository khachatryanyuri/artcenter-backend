import { Request, Response, NextFunction } from 'express';

import { CustomError } from '../utils/errors';
import logger from '../utils/logger';
import { ICustomError } from '../interfaces/errorInterface';

export const errorHandler = (error: ICustomError, req: Request, res: Response, next: NextFunction): void => {
  logger.error(`Status Code: ${error.statusCode} - Error: ${error.message}`);

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
