import { NextFunction, Request, Response } from 'express';

import logger from '../utils/logger';
import { Language } from '../models/languageModel';
import { LanguageService } from '../services/languagesService';

const languageService = new LanguageService();

export class LanguagesController {
  public async registerLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await languageService.registerLanguage(req.body);
      res.status(201).json({ message: 'Language registered successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Language registered was successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getLanguageById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languageId = req.params.id;
      const language = await languageService.getLanguageById(languageId);
      res.json(language);
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Language successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async getAllLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = await languageService.getAllLanguages(req.query);
      const totalCount = await Language.countDocuments();
      res.status(200).json({ data: languages, total: totalCount });
      logger.info(`Status Code: ${res.statusCode} - Message: Receiving data Languages successfully`);
    } catch (error) {
      next(error);
    }
  }

  public async deleteLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languageId = req.params.id;
      await languageService.deleteLanguageById(languageId);
      res.json({ message: 'Language deleted successfully' });
      logger.info(`Status Code: ${res.statusCode} - Message: Language delete was successful`);
    } catch (error) {
      next(error);
    }
  }
}
