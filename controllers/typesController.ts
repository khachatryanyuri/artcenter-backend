import { Request, Response, NextFunction } from 'express';

import { TypesService } from '../services/typesService';
import logger from '../utils/logger';

const typesService = new TypesService();

export class TypesController {
  public async registerTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await typesService.registerTypes(req.body, req.file as Express.Multer.File);
      res.status(201).json({ message: 'Types registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Types registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await typesService.getAllTypes(req.query);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Types successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const types = await typesService.getOneTypes(courseId);
      res.json(types);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Types successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const updatedTypes = await typesService.updateTypes(req.body, req.file as Express.Multer.File, courseId);
      res.status(201).json(updatedTypes);
      logger.info(`Status Code: ${res.statusCode} - Message: Types update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      await typesService.deleteTypes(courseId);
      res.json({ message: 'Types Form deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Types delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
