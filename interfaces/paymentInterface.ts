import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REVERSED = 'REVERSED'
}

export interface IPayment extends Document {
  applicationId?: Types.ObjectId;
  serviceApplicationId?: Types.ObjectId;
  orderNumber: string; // Our internal human-readable ID
  bankOrderId?: string; // The orderId returned by InecoBank
  amountAMD: number;
  currency: string;
  status: PaymentStatus;
  bankErrorCode?: number;
  bankErrorMessage?: string;
}

export interface IPaymentDocument extends IPayment, Document {
  [key: string]: any;
}
