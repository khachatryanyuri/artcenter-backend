import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PaymentsController } from '../controllers/paymentsController';
import { authorize, PassportConfig } from '../utils/passport';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;
const passportConfig = new PassportConfig();

const initiateServiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many payment attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export class PaymentsRoutes {
  router: Router;
  public paymentsController: PaymentsController = new PaymentsController();

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post('/payments/verify', this.paymentsController.verify);
    
    this.router.get('/payments/public/:id', this.paymentsController.getPublicPayment);
    
    this.router.post(
      '/payments/create-service-invoice',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.paymentsController.createServiceInvoice
    );
    
    this.router.post('/payments/initiate-service', initiateServiceLimiter, this.paymentsController.initiateServicePayment);
    
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
