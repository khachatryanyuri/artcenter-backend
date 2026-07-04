import axios from 'axios';
import mongoose from 'mongoose';
import { Environment } from '../utils/env';
import { Payment } from '../models/paymentModel';
import { CoursesApplication } from '../models/coursesApplicationModel';
import { PaymentStatus } from '../interfaces/paymentInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ServicesApplication } from '../models/servicesApplicationModel';

export class PaymentsService {
  private readonly baseUrl = Environment.inecoBankApiUrl || 'https://pg.inecoecom.am/payment/rest';
  private readonly userName = Environment.inecoBankUsername || '';
  private readonly password = Environment.inecoBankPassword || '';
  private readonly returnUrl = Environment.paymentReturnUrl || 'http://localhost:3000/payment-result';

  public async checkout(applicationId: string): Promise<{ formUrl: string }> {
    const application = await CoursesApplication.findById(applicationId);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (!application.totalPriceAMD) {
      throw new BadRequestError('Application does not have a total price set');
    }

    // Amount should be in minor denominations (cents/lumas). So 100 AMD = 10000
    const amount = Math.round(application.totalPriceAMD * 100);
    // orderNumber must be max 24 characters (AN..24)
    const orderNumber = `APP-${Date.now()}`;

    // Register with InecoBank
    try {
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

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
        currency: '051',
        status: PaymentStatus.PENDING,
      });
      await payment.save();

      return { formUrl };
    } catch (error: any) {
      console.error('Checkout error:', error.message);
      throw new BadRequestError(`Failed to initiate payment: ${error.message}`);
    }
  }

  public async verify(bankOrderId: string): Promise<{ status: string }> {
    const payment = await Payment.findOne({ bankOrderId });
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    try {
      const payload = new URLSearchParams();
      payload.append('userName', this.userName);
      payload.append('password', this.password);
      payload.append('orderId', bankOrderId);

      const response = await axios.post(`${this.baseUrl}/getOrderStatusExtended.do`, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { errorCode, errorMessage, orderStatus } = response.data;

      if (errorCode !== 0 && errorCode !== '0') {
        payment.status = PaymentStatus.FAILED;
        payment.bankErrorCode = errorCode;
        payment.bankErrorMessage = errorMessage;
        await payment.save();
        return { status: payment.status };
      }

      // Status codes: 2 = Deposited successfully, 4 = Refunded, 6 = Declined
      if (orderStatus === 2) {
        payment.status = PaymentStatus.COMPLETED;
      } else if (orderStatus === 4) {
        payment.status = PaymentStatus.REFUNDED;
      } else if (orderStatus === 6) {
        payment.status = PaymentStatus.FAILED;
      }

      await payment.save();

      // Update Application Status
      if (payment.status === PaymentStatus.COMPLETED) {
        if (payment.applicationId) {
          await CoursesApplication.findByIdAndUpdate(payment.applicationId, {
            paymentStatus: 'PAID'
          });
        }
        if (payment.serviceApplicationId) {
          await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, {
            paymentStatus: 'PAID'
          });
        }
      }

      return { status: payment.status };
    } catch (error: any) {
      console.error('Verify error:', error.message);
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

  public async createServiceInvoice(serviceApplicationId: string, amountAMD: number): Promise<{ paymentUrl: string, paymentId: string }> {
    const application = await ServicesApplication.findById(serviceApplicationId);
    if (!application) {
      throw new NotFoundError('Service Application not found');
    }

    const orderNumber = `SRV-${Date.now()}`;
    const amount = Math.round(amountAMD * 100);

    // Save payment attempt
    const payment = new Payment({
      serviceApplicationId: application._id,
      orderNumber,
      amountAMD: amountAMD,
      currency: '051',
      status: PaymentStatus.PENDING,
    });
    await payment.save();

    return { 
      paymentUrl: `http://localhost:3000/checkout/service?id=${payment._id.toString()}`,
      paymentId: payment._id.toString() 
    };
  }

  public async getPublicPayment(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Payment not found');
    }
    const payment = await Payment.findById(id).populate('serviceApplicationId');
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { orderId, formUrl, errorCode, errorMessage } = response.data;

      if (errorCode !== 0 && errorCode !== '0') {
        throw new Error(errorMessage || `Bank error code: ${errorCode}`);
      }

      payment.bankOrderId = orderId;
      await payment.save();

      return { formUrl };
    } catch (error: any) {
      console.error('Checkout error:', error.message);
      throw new BadRequestError(`Failed to initiate payment: ${error.message}`);
    }
  }

  public async refundPayment(paymentId: string, amountAMD: number): Promise<{ success: boolean; data: any }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== PaymentStatus.COMPLETED) throw new BadRequestError('Payment is not completed');
    if (!payment.bankOrderId) throw new BadRequestError('Payment does not have a bank order ID');

    const amountLuma = Math.round(amountAMD * 100);

    const params = new URLSearchParams();
    params.append('userName', this.userName);
    params.append('password', this.password);
    params.append('orderId', payment.bankOrderId);
    params.append('amount', amountLuma.toString());

    try {
      const response = await fetch(`${this.baseUrl}/refund.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const data = await response.json();
      if (data.errorCode && data.errorCode !== '0') {
        throw new Error(data.errorMessage || `Bank refund failed with code ${data.errorCode}`);
      }

      payment.status = PaymentStatus.REFUNDED;
      await payment.save();

      if (payment.applicationId) {
        await CoursesApplication.findByIdAndUpdate(payment.applicationId, { paymentStatus: 'REFUNDED' });
      } else if (payment.serviceApplicationId) {
        await ServicesApplication.findByIdAndUpdate(payment.serviceApplicationId, { paymentStatus: 'REFUNDED' });
      }

      return { success: true, data };
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async reversePayment(paymentId: string): Promise<{ success: boolean; data: any }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== PaymentStatus.COMPLETED) throw new BadRequestError('Payment is not completed');
    if (!payment.bankOrderId) throw new BadRequestError('Payment does not have a bank order ID');

    const params = new URLSearchParams();
    params.append('userName', this.userName);
    params.append('password', this.password);
    params.append('orderId', payment.bankOrderId);

    try {
      const response = await fetch(`${this.baseUrl}/reverse.do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const data = await response.json();
      if (data.errorCode && data.errorCode !== '0') {
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
      throw new Error(`Failed to reverse payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
