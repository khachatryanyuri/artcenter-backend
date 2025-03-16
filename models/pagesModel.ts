import mongoose, { Schema } from 'mongoose';
import { IPage } from '../interfaces/pagesInterface';

const PageSchema: Schema<IPage> = new Schema<IPage>(
  {
    name: {
      type: String,
      required: true,
    },

    keys: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

PageSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Pages = mongoose.model<IPage>('Pages', PageSchema);
