import mongoose, { Schema } from 'mongoose';

import { ILessonPricing } from '../interfaces/lessonPricingInterface';

const PricingDurationSchema = new Schema(
  {
    duration: { type: Number, enum: [30, 45, 60], required: true },
    priceAMD: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const PricingTierSchema = new Schema(
  {
    participantCount: { type: Number, required: true, min: 1, default: 1 },
    durations: { type: [PricingDurationSchema], required: true, default: [] },
  },
  { _id: false },
);

const PricingSectionSchema = new Schema(
  {
    title: { type: Object, required: true }, // { hy: '...', ru: '...', en: '...' }
    description: { type: Object, default: {} }, // optional localized description
    levels: { type: [String], default: [] },
    tiers: { type: [PricingTierSchema], required: true, default: [] },
  },
  { _id: false }
);

const DiscountSchema = new Schema(
  {
    condition: { type: String, required: true }, // e.g. 'fullCourse', '8lessons'
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const LessonPricingSchema: Schema<ILessonPricing> = new Schema<ILessonPricing>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Courses',
      required: true,
      unique: true, // One pricing config per course
    },
    label: {
      type: Object,
      default: {},
    }, // { hy: '...', ru: '...', en: '...' }
    sections: { type: [PricingSectionSchema], required: true, default: [] },
    discounts: { type: [DiscountSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

LessonPricingSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    if (ret.courseId && typeof ret.courseId.toString === 'function') {
      ret.courseId = ret.courseId.toString();
    }
    delete ret._id;
    delete ret.__v;
  },
});

export const LessonPricing = mongoose.model<ILessonPricing>('LessonPricing', LessonPricingSchema);
