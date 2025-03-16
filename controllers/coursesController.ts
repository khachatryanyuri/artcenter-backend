import { Request, Response, NextFunction } from 'express';

import { CoursesService } from '../services/coursesService';
import logger from '../utils/logger';

const coursesService = new CoursesService();

export class CoursesController {
  public async registerCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await coursesService.registerCourses(req.body, req.file as Express.Multer.File);
      res.status(201).json({ message: 'Courses registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Courses registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await coursesService.getAllCourses(req.query);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Courses successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const courses = await coursesService.getOneCourses(courseId);
      res.json(courses);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Courses successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const updatedCourses = await coursesService.updateCourses(req.body, req.file as Express.Multer.File, courseId);
      res.status(201).json(updatedCourses);
      logger.info(`Status Code: ${res.statusCode} - Message: Courses update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      await coursesService.deleteCourses(courseId);
      res.json({ message: 'Courses Form deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Courses delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
