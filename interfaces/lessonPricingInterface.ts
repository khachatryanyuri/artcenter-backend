import mongoose, { Document } from 'mongoose';

export interface IPricingDuration {
  duration: 30 | 45 | 60;
  priceAMD: number;
}

export interface IPricingTier {
  participantCount: number; // 1 = individual, 2 = pair, 3 = trio, etc.
  durations: IPricingDuration[];
}

export type DiscountCondition = 'fullCourse' | '8lessons' | string;

export interface IDiscount {
  condition: DiscountCondition;
  percentage: number;
}

export interface IPricingSection {
  title: Record<string, string>;
  description?: Record<string, string>;
  levels?: string[];
  tiers: IPricingTier[];
}

export interface ILessonPricing extends Document {
  courseId: mongoose.Types.ObjectId;
  label: Record<string, string>; // localised display name: { hy: '...', ru: '...', en: '...' }
  sections: IPricingSection[];
  discounts: IDiscount[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
