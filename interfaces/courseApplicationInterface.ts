import { Document } from 'mongoose';

export interface ICoursesApplication extends Document {
  count: number;
  persons: { age: number; name: string }[];
  location: string;
  email: string;
  skype?: string;
  whatsapp?: string;
  fieldOfStudy: string;
  skillLevel: string;
  wishes?: string;
  pricingSection?: string;
  duration?: number;
  package?: string;
  participantCount?: number;
  totalPriceAMD?: number;
  totalPriceUSD?: number;
  paymentStatus?: string;
}

export interface ICoursesApplicationDocument extends ICoursesApplication, Document {
  [key: string]: any;
}
