import mongoose, { Schema } from 'mongoose';
import { ICoursesApplication } from '../interfaces/courseApplicationInterface';
import { IServicesApplication } from '../interfaces/serviceApplicationInterface';

const ServicesApplicationSchema: Schema<IServicesApplication> = new Schema<IServicesApplication>(
  {
    fieldOfService: {
      type: String,
      required: true,
    },
    wishes: {
      type: String,
      required: false,
    },
    deadline: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    skype: {
      type: String,
      required: false,
    },
    whatsapp: {
      type: String,
      required: false,
    },
    skillLevel: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
ServicesApplicationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const ServicesApplication = mongoose.model<IServicesApplication>(
  'ServicesApplication',
  ServicesApplicationSchema,
);
