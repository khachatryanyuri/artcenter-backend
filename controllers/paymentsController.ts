import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from '../services/paymentsService';

export class PaymentsController {
  private paymentsService: PaymentsService = new PaymentsService();

  public checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { applicationId } = req.body;
      const result = await this.paymentsService.checkout(applicationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bankOrderId } = req.params;
      const result = await this.paymentsService.verify(bankOrderId);
      res.status(200).json(result);
    } catch (error) {
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
      const result = await this.paymentsService.createServiceInvoice(serviceApplicationId, amountAMD);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getPublicPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.paymentsService.getPublicPayment(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public initiateServicePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId } = req.body;
      const result = await this.paymentsService.initiateServicePayment(paymentId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
