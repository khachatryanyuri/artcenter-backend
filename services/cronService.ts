import cron from 'node-cron';
import { Payment } from '../models/paymentModel';
import { PaymentStatus } from '../interfaces/paymentInterface';
import { PaymentsService } from './paymentsService';
import logger from '../utils/logger';

export class CronService {
  private paymentsService: PaymentsService = new PaymentsService();

  public init() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      logger.info('CronJob: Checking pending payments...');
      try {
        // Find payments pending for more than 30 minutes that have a bankOrderId
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        const pendingPayments = await Payment.find({
          status: PaymentStatus.PENDING,
          createdAt: { $lt: thirtyMinutesAgo },
          bankOrderId: { $exists: true, $ne: null },
        });

        for (const payment of pendingPayments) {
          if (payment.bankOrderId) {
            try {
              const result = await this.paymentsService.verify(payment.bankOrderId);
              logger.info(`CronJob: Payment ${payment.orderNumber} status verified as ${result.status}`);
            } catch (error: any) {
              logger.error(`CronJob: Failed to verify payment ${payment.orderNumber} - ${error.message}`);
            }
          }
        }

        // Expire stale service invoices that never got a bankOrderId (customer never visited the link)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const staleInvoices = await Payment.updateMany(
          {
            status: PaymentStatus.PENDING,
            bankOrderId: { $exists: false },
            createdAt: { $lt: twentyFourHoursAgo },
          },
          { $set: { status: PaymentStatus.EXPIRED } },
        );

        if (staleInvoices.modifiedCount > 0) {
          logger.info(`CronJob: Expired ${staleInvoices.modifiedCount} stale service invoice(s)`);
        }
      } catch (error: any) {
        logger.error(`CronJob Error: ${error.message}`);
      }
    });
  }
}
