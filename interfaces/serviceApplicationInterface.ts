import { Document } from 'mongoose';

export interface IServicesApplication extends Document {
  fieldOfService: string;
  wishes?: string;
  deadline: Date;
  name: string;
  email: string;
  skype?: string;
  whatsapp?: string;
  skillLevel: string;
}

export interface IServicesApplicationDocument extends IServicesApplication, Document {
  [key: string]: any;
}
