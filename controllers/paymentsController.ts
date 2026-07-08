import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PaymentsService } from '../services/paymentsService';
import { BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export class PaymentsController {
  private paymentsService: PaymentsService = new PaymentsService();

  public verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bankOrderId } = req.body;
      if (!bankOrderId || typeof bankOrderId !== 'string') {
        throw new BadRequestError('Invalid or missing bankOrderId');
      }
      logger.info(`[PaymentsController] Verifying payment for bankOrderId: ${bankOrderId}`);
      const result = await this.paymentsService.verify(bankOrderId);
      logger.info(`[PaymentsController] Payment verification successful for bankOrderId: ${bankOrderId}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Payment verification failed: ${error}`);
      next(error);
    }
  };

  public getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.paymentsService.getPayments(req.query);
      res.setHeader('Content-Range', `payments ${req.query.range ? JSON.parse(req.query.range as string)[0] : 0}-${req.query.range ? JSON.parse(req.query.range as string)[1] : result.data.length}/${result.total}`);
      res.status(200).json({ data: result.data, total: result.total });
    } catch (error) {
      next(error);
    }
  };

  public getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.paymentsService.getPaymentById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public createServiceInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceApplicationId, amountAMD } = req.body;
      if (!serviceApplicationId || !mongoose.Types.ObjectId.isValid(serviceApplicationId)) {
        throw new BadRequestError('Invalid or missing serviceApplicationId');
      }
      if (!amountAMD || typeof amountAMD !== 'number' || amountAMD <= 0) {
        throw new BadRequestError('amountAMD must be a positive number');
      }
      logger.info(`[PaymentsController] Creating service invoice for serviceApplicationId: ${serviceApplicationId}`);
      const result = await this.paymentsService.createServiceInvoice(serviceApplicationId, amountAMD);
      logger.info(`[PaymentsController] Service invoice created with paymentId: ${result.paymentId}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Failed to create service invoice: ${error}`);
      next(error);
    }
  };

  public getPublicPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid payment ID');
      }
      logger.info(`[PaymentsController] Fetching public payment details for paymentId: ${id}`);
      const result = await this.paymentsService.getPublicPayment(id);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Failed to fetch public payment: ${error}`);
      next(error);
    }
  };

  public initiateServicePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId } = req.body;
      if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new BadRequestError('Invalid or missing paymentId');
      }
      logger.info(`[PaymentsController] Initiating service payment for paymentId: ${paymentId}`);
      const result = await this.paymentsService.initiateServicePayment(paymentId);
      logger.info(`[PaymentsController] Service payment initiated for paymentId: ${paymentId}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Failed to initiate service payment: ${error}`);
      next(error);
    }
  };

  public refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid payment ID');
      }
      const { amountAMD } = req.body;
      if (!amountAMD || typeof amountAMD !== 'number' || amountAMD <= 0) {
        throw new BadRequestError('amountAMD must be a positive number');
      }
      logger.info(`[PaymentsController] Requesting refund for paymentId: ${id}, amount: ${amountAMD}`);
      const result = await this.paymentsService.refundPayment(id, amountAMD);
      logger.info(`[PaymentsController] Refund successful for paymentId: ${id}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Failed to refund payment: ${error}`);
      next(error);
    }
  };

  public reversePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid payment ID');
      }
      logger.info(`[PaymentsController] Requesting reverse for paymentId: ${id}`);
      const result = await this.paymentsService.reversePayment(id);
      logger.info(`[PaymentsController] Reverse successful for paymentId: ${id}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`[PaymentsController] Failed to reverse payment: ${error}`);
      next(error);
    }
  };
}
