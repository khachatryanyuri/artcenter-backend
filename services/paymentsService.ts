import axios from 'axios';
import mongoose from 'mongoose';
import { Environment } from '../utils/env';
import { Payment } from '../models/paymentModel';
import { CoursesApplication } from '../models/coursesApplicationModel';
import { PaymentStatus } from '../interfaces/paymentInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ServicesApplication } from '../models/servicesApplicationModel';
import logger from '../utils/logger';

export class PaymentsService {
  private readonly baseUrl = Environment.inecoBankApiUrl || 'https://pg.inecoecom.am/payment/rest';
  private readonly userName = Environment.inecoBankUsername || '';
  private readonly password = Environment.inecoBankPassword || '';
  private readonly returnUrl = Environment.paymentReturnUrl || 'http://localhost:3000/payment-result';

  /**
   * Registers a payment session at InecoBank for a course application.
   * Includes idempotency: if a PENDING payment already exists for the same
   * application, it re-uses it (re-registering with the bank if the session expired).
   */
  public async checkout(applicationId: string): Promise<{ formUrl: string }> {
    const application = await CoursesApplication.findById(applicationId);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (!application.totalPriceAMD) {
      throw new BadRequestError('Application does not have a total price set');
    }

    // Idempotency: check for an existing PENDING payment for this application
    const existingPayment = await Payment.findOne({
      applicationId: application._id,
      status: PaymentStatus.PENDING,
    });

    if (existingPayment && existingPayment.bankOrderId) {
      // Verify with the bank whether the existing session is still valid
      try {
        const payload = new URLSearchParams();
        payload.append('userName', this.userName);
        payload.append('password', this.password);
        payload.append('orderId', existingPayment.bankOrderId);

        const response = await axios.post(`${this.baseUrl}/getOrderStatusExtended.do`, payload.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { orderStatus } = response.data;

        // orderStatus 0 = registered but not paid — session still valid
        if (orderStatus === 0) {
          const formUrl = `${this.baseUrl.replace('/payment/rest', '')}/payment/merchants/payment_hy.html?mdOrder=${existingPayment.bankOrderId}`;
          // Re-register to get a fresh formUrl from the bank
          const reRegisterPayload = new URLSearchParams();
          reRegisterPayload.append('userName', this.userName);
          reRegisterPayload.append('password', this.password);
          reRegisterPayload.append('orderNumber', existingPayment.orderNumber);
          reRegisterPayload.append('amount', (Math.round(application.totalPriceAMD * 100)).toString());
          reRegisterPayload.append('currency', '051');
          reRegisterPayload.append('returnUrl', this.returnUrl);
          reRegisterPayload.append('description', `Payment for Course Application ${application._id}`);
          reRegisterPayload.append('language', 'hy');

          const reResponse = await axios.post(`${this.baseUrl}/register.do`, reRegisterPayload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });

          if (reResponse.data.errorCode === 0 || reResponse.data.errorCode === '0') {
            existingPayment.bankOrderId = reResponse.data.orderId;
            await existingPayment.save();
            return { formUrl: reResponse.data.formUrl };
          }
          // If errorCode === 1 (order already processed), the old orderId might still have a valid formUrl
          // Fall through and return the original
          if (reResponse.data.formUrl) {
            return { formUrl: reResponse.data.formUrl };
          }
        }
        // If orderStatus is 2/4/6 etc., the existing payment was already used — fall through to create new
      } catch {
        // Bank check failed — fall through to create a new payment
      }
    }

    // Amount should be in minor denominations (cents/lumas). So 100 AMD = 10000
    const amount = Math.round(application.totalPriceAMD * 100);
    // orderNumber must be max 24 characters (AN..24)
    const orderNumber = `APP-${Date.now()}`;

    // Register with InecoBank
    try {
      logger.info(`[PaymentsService] Initiating bank registration for Course Application ${application._id}`);
      const payload = new URLSearchParams();
      payload.append('userName', this.userName);
      payload.append('password', this.password);
      payload.append('orderNumber', orderNumber);
      payload.append('amount', amount.toString());
      payload.append('currency', '051'); // AMD
      payload.append('returnUrl', this.returnUrl);
      payload.append('description', `Payment for Course Application ${application._id}`);
      payload.append('language', 'hy');

      const response = await axios.post(`${this.baseUrl}/register.do`, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      logger.info(`[PaymentsService] Bank response for Course Application ${application._id}: errorCode=${response.data.errorCode}`);

      const { orderId, formUrl, errorCode, errorMessage } = response.data;

      if (errorCode !== 0 && errorCode !== '0') {
        throw new Error(errorMessage || `Bank error code: ${errorCode}`);
      }

      // Save payment attempt
      const payment = new Payment({
        applicationId: application._id,
        orderNumber,
        bankOrderId: orderId,
        amountAMD: application.totalPriceAMD,
        refundedAmountAMD: 0,
        currency: '051',
        status: PaymentStatus.PENDING,
      });
      await payment.save();

      return { formUrl };
    } catch (error: any) {
      logger.error(`[PaymentsService] Checkout error for application ${applicationId}: ${error.message}`);
      throw new BadRequestError(`Failed to initiate payment: ${error.message}`);
    }
  }

  /**
   * Verifies a payment with InecoBank using getOrderStatusExtended.do.
   * Maps all 7 bank orderStatus values (0–6) to internal PaymentStatus.
   */
  public async verify(bankOrderId: string): Promise<{ status: string }> {
    const payment = await Payment.findOne({ bankOrderId });
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    try {
      logger.info(`[PaymentsService] Verifying bankOrderId: ${bankOrderId}`);
      const payload = new URLSearchParams();
      payload.append('userName', this.userName);
      payload.append('password', this.password);
      payload.append('orderId', bankOrderId);

      const response = await axios.post(`${this.baseUrl}/getOrderStatusExtended.do`, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { errorCode, errorMessage, orderStatus } = response.data;
      logger.info(`[PaymentsService] Verify response for ${bankOrderId}: errorCode=${errorCode}, orderStatus=${orderStatus}`);

      if (errorCode !== 0 && errorCode !== '0') {
        payment.status = PaymentStatus.FAILED;
        payment.bankErrorCode = errorCode;
        payment.bankErrorMessage = errorMessage;
        await payment.save();
        return { status: payment.status };
      }

      // Map all bank orderStatus values per InecoBank PG v1.1.1:
      // 0 = Order registered, but not paid
      // 1 = Preauthorization amount was put on hold (two-phase)
      // 2 = Amount was deposited successfully
      // 3 = Authorization has been reversed
      // 4 = Transaction has been refunded
      // 5 = Authorization is initiated via the issuer's ACS (3DS in progress)
      // 6 = Authorization is declined
      switch (orderStatus) {
        case 0:
        case 1:
        case 5:
          payment.status = PaymentStatus.PENDING;
          break;
        case 2:
          payment.status = PaymentStatus.COMPLETED;
          break;
        case 3:
          payment.status = PaymentStatus.REVERSED;
          break;
        case 4:
          payment.status = PaymentStatus.REFUNDED;
          break;
        case 6:
          payment.status = PaymentStatus.FAILED;
          break;
        default:
          payment.status = PaymentStatus.FAILED;
          break;
      }

      // If the bank provides paymentAmountInfo (v03), sync refundedAmount
      if (response.data.paymentAmountInfo?.refundedAmount != null) {
        const bankRefundedLumas = Number(response.data.paymentAmountInfo.refundedAmount);
        payment.refundedAmountAMD = bankRefundedLumas / 100;
      }

      await payment.save();

      // Update linked Application Status
      if (payment.status === PaymentStatus.COMPLETED) {
        if (payment.applicationId) {
          await CoursesApplication.findByIdAndUpdate(payment.applicationId, {
            paymentStatus: 'PAID',
          });
        }
        if (payment.serviceApplicationId) {
          await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, {
            paymentStatus: 'PAID',
          });
        }
      } else if (payment.status === PaymentStatus.REVERSED) {
        if (payment.applicationId) {
          await CoursesApplication.findByIdAndUpdate(payment.applicationId, { paymentStatus: 'REVERSED' });
        }
        if (payment.serviceApplicationId) {
          await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, { paymentStatus: 'REVERSED' });
        }
      }

      return { status: payment.status };
    } catch (error: any) {
      logger.error(`[PaymentsService] Verify error for ${bankOrderId}: ${error.message}`);
      throw new BadRequestError(`Failed to verify payment: ${error.message}`);
    }
  }

  public async getPayments(queryParams: any) {
    const { range, sort, filter } = queryParams;
    let query = {};
    if (filter) {
      const parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;
      if (parsedFilter.applicationId) {
        query = { applicationId: parsedFilter.applicationId };
      }
    }

    let sortOptions = {};
    if (sort) {
      const parsedSort = typeof sort === 'string' ? JSON.parse(sort) : sort;
      sortOptions = { [parsedSort[0]]: parsedSort[1] === 'ASC' ? 1 : -1 };
    }

    const skip = range ? JSON.parse(range as string)[0] : 0;
    const limit = range ? JSON.parse(range as string)[1] - skip + 1 : 10;

    const [payments, total] = await Promise.all([
      Payment.find(query).sort(sortOptions).skip(skip).limit(limit),
      Payment.countDocuments(query),
    ]);

    return { data: payments, total };
  }

  public async getPaymentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Payment not found');
    }
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  public async createServiceInvoice(
    serviceApplicationId: string,
    amountAMD: number,
  ): Promise<{ paymentUrl: string; paymentId: string }> {
    const application = await ServicesApplication.findById(serviceApplicationId);
    if (!application) {
      throw new NotFoundError('Service Application not found');
    }

    const orderNumber = `SRV-${Date.now()}`;

    // Save payment attempt
    const payment = new Payment({
      serviceApplicationId: application._id,
      orderNumber,
      amountAMD: amountAMD,
      refundedAmountAMD: 0,
      currency: '051',
      status: PaymentStatus.PENDING,
    });
    await payment.save();

    return {
      paymentUrl: `${Environment.frontendBaseUrl}/checkout/service?id=${payment._id.toString()}`,
      paymentId: payment._id.toString(),
    };
  }

  public async getPublicPayment(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Payment not found');
    }
    // Only populate the safe fields from the service application (exclude name, email, phone, wishes, etc.)
    const payment = await Payment.findById(id).populate({
      path: 'serviceApplicationId',
      select: 'fieldOfService',
    });
    
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  public async initiateServicePayment(paymentId: string): Promise<{ formUrl: string }> {
    const payment = await Payment.findById(paymentId).populate('serviceApplicationId');
    if (!payment || payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestError('Invalid or already processed payment');
    }

    const application = payment.serviceApplicationId as any;
    const amount = Math.round(payment.amountAMD * 100);

    try {
      logger.info(`[PaymentsService] Initiating bank registration for Service Application ${application._id}`);
      const payload = new URLSearchParams();
      payload.append('userName', this.userName);
      payload.append('password', this.password);
      payload.append('orderNumber', payment.orderNumber);
      payload.append('amount', amount.toString());
      payload.append('currency', '051'); // AMD
      payload.append('returnUrl', this.returnUrl);
      payload.append('description', `Payment for Service Application ${application._id}`);
      payload.append('language', 'hy');

      const response = await axios.post(`${this.baseUrl}/register.do`, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      logger.info(`[PaymentsService] Bank response for Service Application ${application._id}: errorCode=${response.data.errorCode}`);

      const { orderId, formUrl, errorCode, errorMessage } = response.data;

      if (errorCode !== 0 && errorCode !== '0') {
        throw new Error(errorMessage || `Bank error code: ${errorCode}`);
      }

      payment.bankOrderId = orderId;
      await payment.save();

      return { formUrl };
    } catch (error: any) {
      logger.error(`[PaymentsService] Checkout error for service payment ${paymentId}: ${error.message}`);
      throw new BadRequestError(`Failed to initiate payment: ${error.message}`);
    }
  }

  /**
   * Refund a payment (full or partial).
   * Bank doc: "EPG allows multiple refunds but their total amount cannot
   * exceed the amount that was deposited from the customer's account."
   */
  public async refundPayment(paymentId: string, amountAMD: number): Promise<{ success: boolean; data: any }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');

    if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new BadRequestError('Payment must be in COMPLETED or PARTIALLY_REFUNDED status to refund');
    }
    if (!payment.bankOrderId) throw new BadRequestError('Payment does not have a bank order ID');

    const remainingAMD = payment.amountAMD - payment.refundedAmountAMD;
    if (amountAMD <= 0) {
      throw new BadRequestError('Refund amount must be a positive number');
    }
    if (amountAMD > remainingAMD) {
      throw new BadRequestError(
        `Refund amount (${amountAMD}) exceeds remaining refundable balance (${remainingAMD})`,
      );
    }

    const amountLuma = Math.round(amountAMD * 100);

    try {
      logger.info(`[PaymentsService] Initiating refund for paymentId ${paymentId}, amount: ${amountAMD} AMD`);
      const params = new URLSearchParams();
      params.append('userName', this.userName);
      params.append('password', this.password);
      params.append('orderId', payment.bankOrderId);
      params.append('amount', amountLuma.toString());

      const response = await axios.post(`${this.baseUrl}/refund.do`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      logger.info(`[PaymentsService] Bank refund response for paymentId ${paymentId}: errorCode=${response.data.errorCode}`);

      const data = response.data;
      if (data.errorCode && data.errorCode !== 0 && data.errorCode !== '0') {
        throw new Error(data.errorMessage || `Bank refund failed with code ${data.errorCode}`);
      }

      payment.refundedAmountAMD += amountAMD;

      if (payment.refundedAmountAMD >= payment.amountAMD) {
        payment.status = PaymentStatus.REFUNDED;
      } else {
        payment.status = PaymentStatus.PARTIALLY_REFUNDED;
      }
      await payment.save();

      const appPaymentStatus = payment.status === PaymentStatus.REFUNDED ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      if (payment.applicationId) {
        await CoursesApplication.findByIdAndUpdate(payment.applicationId, { paymentStatus: appPaymentStatus });
      } else if (payment.serviceApplicationId) {
        await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, {
          paymentStatus: appPaymentStatus,
        });
      }

      return { success: true, data };
    } catch (error) {
      logger.error(`[PaymentsService] Refund error for paymentId ${paymentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestError(
        `Failed to refund payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Reverse a payment (full cancellation).
   * Bank doc: "The reversal operation may be performed only once."
   */
  public async reversePayment(paymentId: string): Promise<{ success: boolean; data: any }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status === PaymentStatus.REVERSED) {
      throw new BadRequestError('Payment has already been reversed');
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestError('Payment is not completed');
    }
    if (!payment.bankOrderId) throw new BadRequestError('Payment does not have a bank order ID');

    const amountLuma = Math.round(payment.amountAMD * 100);

    try {
      logger.info(`[PaymentsService] Initiating reverse for paymentId ${paymentId}`);
      const params = new URLSearchParams();
      params.append('userName', this.userName);
      params.append('password', this.password);
      params.append('orderId', payment.bankOrderId);
      params.append('amount', amountLuma.toString());

      const response = await axios.post(`${this.baseUrl}/reverse.do`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      logger.info(`[PaymentsService] Bank reverse response for paymentId ${paymentId}: errorCode=${response.data.errorCode}`);

      const data = response.data;
      if (data.errorCode && data.errorCode !== 0 && data.errorCode !== '0') {
        throw new Error(data.errorMessage || `Bank reverse failed with code ${data.errorCode}`);
      }

      payment.status = PaymentStatus.REVERSED;
      await payment.save();

      if (payment.applicationId) {
        await CoursesApplication.findByIdAndUpdate(payment.applicationId, { paymentStatus: 'REVERSED' });
      } else if (payment.serviceApplicationId) {
        await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, { paymentStatus: 'REVERSED' });
      }

      return { success: true, data };
    } catch (error) {
      logger.error(`[PaymentsService] Reverse error for paymentId ${paymentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestError(
        `Failed to reverse payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
