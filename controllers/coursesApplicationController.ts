import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import { CoursesApplicationService } from '../services/coursesApplicationService';
import { PaymentsService } from '../services/paymentsService';

const coursesApplicationService = new CoursesApplicationService();
const paymentsService = new PaymentsService();

export class CoursesApplicationController {
  public async registerCoursesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseApp = await coursesApplicationService.registerCoursesApplication(req.body);
      const responseData: any = { id: courseApp.id || (courseApp as any)._id, message: 'Courses Application registered successfully' };
      
      if (courseApp.totalPriceAMD && courseApp.totalPriceAMD > 0) {
        const paymentResult = await paymentsService.checkout(responseData.id.toString());
        if (paymentResult.formUrl) {
          responseData.formUrl = paymentResult.formUrl;
        }
      }
      
      res.status(201).json(responseData);
      logger.info(`Status Code: ${res.statusCode} - Message: Courses Application registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllCoursesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await coursesApplicationService.getAllCoursesApplication(req.query);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Courses Application successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneCoursesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const courses = await coursesApplicationService.getOneCoursesApplication(courseId);
      res.json(courses);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Courses Application successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateCoursesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      const updatedCourses = await coursesApplicationService.updateCoursesApplication(req.body, courseId);
      res.status(201).json(updatedCourses);
      logger.info(`Status Code: ${res.statusCode} - Message: Courses Application update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteCoursesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.id;
      await coursesApplicationService.deleteCoursesApplication(courseId);
      res.json({ message: 'Courses Form deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Courses Application delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
