import mongoose, { Schema, Document } from 'mongoose';

import { IContent } from '../interfaces/contentInterface';

const ContentSchema: Schema<IContent> = new Schema<IContent>(
  {
    page: {
      type: String,
      required: true,
    },
    key: {
      type: String,

      required: true,
    },
    title: {
      type: Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

ContentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Content = mongoose.model<IContent>('Content', ContentSchema);
