import mongoose, { Schema } from 'mongoose';
import { IPayment, PaymentStatus } from '../interfaces/paymentInterface';

const PaymentSchema: Schema<IPayment> = new Schema<IPayment>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'CoursesApplication',
      required: false,
    },
    serviceApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'ServicesApplication',
      required: false,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bankOrderId: {
      type: String,
      required: false,
    },
    amountAMD: {
      type: Number,
      required: true,
    },
    refundedAmountAMD: {
      type: Number,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: '051', // AMD
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    bankErrorCode: {
      type: Number,
      required: false,
    },
    bankErrorMessage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

PaymentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
