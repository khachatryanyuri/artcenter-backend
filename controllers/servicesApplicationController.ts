import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import { ServicesApplicationService } from '../services/servicesApplicationService';

const servicesApplicationService = new ServicesApplicationService();

export class ServicesApplicationController {
  public async registerServicesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await servicesApplicationService.registerServicesApplication(req.body);
      res.status(201).json({ message: 'Services Application registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Services Application registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllServicesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await servicesApplicationService.getAllServicesApplication(req.query);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Services Application successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneServicesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = req.params.id;
      const service = await servicesApplicationService.getOneServicesApplication(serviceId);
      res.json(service);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Services Application successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateServicesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = req.params.id;
      const updatedService = await servicesApplicationService.updateServicesApplication(req.body, serviceId);
      res.status(201).json(updatedService);
      logger.info(`Status Code: ${res.statusCode} - Message: Services Application update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteServicesApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceId = req.params.id;
      await servicesApplicationService.deleteServicesApplication(serviceId);
      res.json({ message: 'Services Form deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Services Application delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
