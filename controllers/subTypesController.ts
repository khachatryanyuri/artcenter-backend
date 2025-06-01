import { Request, Response, NextFunction } from 'express';

import { SubTypesService } from '../services/subTypesService';
import logger from '../utils/logger';

const subTypesService = new SubTypesService();

export class SubTypesController {
  public async registerSubTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subTypesService.registerSubTypes(req.body, req.file as Express.Multer.File);
      res.status(201).json({ message: 'Sub Types registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Sub Types registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllSubTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await subTypesService.getAllSubTypes(req.query);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data sub Types successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneSubTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const subTypes = await subTypesService.getOneSubTypes(courseId);
      res.json(subTypes);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data sub Types successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateSubTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const updatedSubTypes = await subTypesService.updateSubTypes(req.body, req.file as Express.Multer.File, courseId);
      res.status(201).json(updatedSubTypes);
      logger.info(`Status Code: ${res.statusCode} - Message: Sub Types update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteSubTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      await subTypesService.deleteSubTypes(courseId);
      res.json({ message: 'Sub Types Form deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message:Sub Types delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
