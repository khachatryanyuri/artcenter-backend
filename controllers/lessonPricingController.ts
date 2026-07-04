import { Request, Response, NextFunction } from 'express';

import { LessonPricingService } from '../services/lessonPricingService';
import logger from '../utils/logger';

const lessonPricingService = new LessonPricingService();

export class LessonPricingController {
  /**
   * GET /api/pricing/exchange-rate
   * Returns the current AMD/USD rate (server-cached for 24h).
   */
  public async getExchangeRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usdExchangeRate = await lessonPricingService.getExchangeRate();
      res.status(200).json({ usdExchangeRate });
      logger.info(`Status Code: ${res.statusCode} - Message: Exchange rate served`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pricing
   * Full list — consumed by Admin CMS.
   */
  public async getAllPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { data, total } = await lessonPricingService.getAllPricing(req.query);
      res.setHeader('Content-Range', `pricing 0-${data.length}/${total}`);
      res.status(200).json({ data, total });
      logger.info(`Status Code: ${res.statusCode} - Message: All pricing configs served`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pricing/by-course/:courseId
   * Consumed by the Next.js public frontend — returns pricing + exchange rate.
   */
  public async getByCourseId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const result = await lessonPricingService.getByCourseId(courseId);
      if (!result) {
        res.status(404).json({ message: `No active pricing found for courseId: ${courseId}` });
        return;
      }
      res.status(200).json(result);
      logger.info(`Status Code: ${res.statusCode} - Message: Pricing by courseId "${courseId}" served`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pricing/:id
   * Single record by Mongo _id — consumed by Admin CMS edit view.
   */
  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await lessonPricingService.getById(req.params.id);
      res.status(200).json(pricing);
      logger.info(`Status Code: ${res.statusCode} - Message: Pricing config ${req.params.id} served`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pricing
   * Create new pricing config — Admin CMS only.
   */
  public async createPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await lessonPricingService.createPricing(req.body);
      res.status(201).json(pricing);
      logger.info(`Status Code: ${res.statusCode} - Message: Pricing config created`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pricing/:id
   * Update pricing config — Admin CMS only.
   */
  public async updatePricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await lessonPricingService.updatePricing(req.params.id, req.body);
      res.status(200).json(pricing);
      logger.info(`Status Code: ${res.statusCode} - Message: Pricing config ${req.params.id} updated`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/pricing/:id
   * Delete pricing config — Admin CMS only.
   */
  public async deletePricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await lessonPricingService.deletePricing(req.params.id);
      res.status(200).json({ message: 'Pricing config deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Pricing config ${req.params.id} deleted`);
    } catch (error) {
      next(error);
    }
  }
}
