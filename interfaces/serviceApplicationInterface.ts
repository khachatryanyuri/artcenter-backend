import { Document } from 'mongoose';

export interface IServicesApplication extends Document {
  fieldOfService: string;
  wishes?: string;
  deadline: Date;
  name: string;
  email: string;
  skype?: string;
  whatsapp?: string;
  telegram?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'REVERSED';
}

export interface IServicesApplicationDocument extends IServicesApplication, Document {
  [key: string]: any;
}
