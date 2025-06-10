import mongoose, { Schema } from 'mongoose';

import { ICourses } from '../interfaces/coursesInterface';

const CourseSchema: Schema<ICourses> = new Schema<ICourses>(
  {
    title: { type: Schema.Types.Mixed, default: {} },
    description: { type: Schema.Types.Mixed, default: {} },
    picture: {
      type: String,
      required: true,
    },
    typesKey: {
      type: String,
      required: true,
    },
    subTypesKey: {
      type: String,
      required: true,
    },
    subTypesThemeKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

CourseSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Courses = mongoose.model<ICourses>('Courses', CourseSchema);
