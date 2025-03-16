import { Request, Response, NextFunction } from 'express';

import logger from '../utils/logger';
import { ContentService } from '../services/contentService';
import { Content } from '../models/contentModel';
import { Pages } from '../models/pagesModel';

const contentService = new ContentService();

export class ContentController {
  public async createContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contentService.createContent(req.body);
      res.status(201).json({ message: 'Content created successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Content registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = await contentService.getAllContent(req.query);
      const totalCount = await Content.countDocuments();
      res.status(200).json({ data: content, total: totalCount });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Content successfully`);
    } catch (error) {
      next(error);
    }
  }
  public async getAllPages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pages = await contentService.getAllPages(req.query);
      const totalCount = await Pages.countDocuments();
      res.status(200).json({ data: pages, total: totalCount });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data pages successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getOneContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contentId = req.params.id;
      const content = await contentService.getOneContent(contentId);
      res.json(content);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Content successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async updateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contentId = req.params.id;
      const updatedContent = await contentService.updateContent(req.body, contentId);
      res.status(201).json(updatedContent);
      logger.info(`Status Code: ${res.statusCode} - Message: Content update was successful`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contentId = req.params.id;
      await contentService.deleteContent(contentId);
      res.json({ message: 'Content deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Content delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
