import mongoose, { Schema } from 'mongoose';
import { ICoursesApplication } from '../interfaces/courseApplicationInterface';

const CoursesApplicationSchema: Schema<ICoursesApplication> = new Schema<ICoursesApplication>(
  {
    count: {
      type: Number,
      required: true,
    },

    persons: {
      type: [
        {
          age: { type: Number, required: true },
          name: { type: String, required: true },
        },
      ],
      required: true,
    },
    location: {
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
    fieldOfStudy: {
      type: String,
      required: true,
    },
    skillLevel: {
      type: String,
      required: true,
    },
    wishes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

CoursesApplicationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const CoursesApplication = mongoose.model<ICoursesApplication>('CoursesApplication', CoursesApplicationSchema);
