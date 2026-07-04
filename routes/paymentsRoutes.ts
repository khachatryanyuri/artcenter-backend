import { Router } from 'express';
import { PaymentsController } from '../controllers/paymentsController';
import { authorize, PassportConfig } from '../utils/passport';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;
const passportConfig = new PassportConfig();

export class PaymentsRoutes {
  router: Router;
  public paymentsController: PaymentsController = new PaymentsController();

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post('/payments/checkout', this.paymentsController.checkout);
    
    this.router.get('/payments/verify/:bankOrderId', this.paymentsController.verify);
    
    this.router.get('/payments/public/:id', this.paymentsController.getPublicPayment);
    
    this.router.post(
      '/payments/create-service-invoice',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.createServiceInvoice
    );
    
    this.router.post('/payments/initiate-service', this.paymentsController.initiateServicePayment);
    
    this.router.get(
      '/payments',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.getPayments
    );

    this.router.get(
      '/payments/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.getPaymentById
    );

    this.router.post(
      '/payments/:id/refund',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.refundPayment
    );

    this.router.post(
      '/payments/:id/reverse',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.reversePayment
    );
  }
}
