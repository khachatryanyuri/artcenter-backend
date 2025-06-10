import mongoose, { Schema, Document } from 'mongoose';

export interface ISubType extends Document {
  key: string;
  type: {
    name?: any;
    key?: string;
  }[];
  title: any;
  desc: any;
  picture: string;
}

export interface ISubTypeDocument extends ISubType, Document {
  [key: string]: any;
}

const SubTypeSchema: Schema<ISubType> = new Schema<ISubType>(
  {
    key: { type: String, required: true },
    type: [
      {
        name: { type: Schema.Types.Mixed, default: {} },
        key: { type: String },
      },
    ],
    title: { type: Schema.Types.Mixed, default: {} },
    desc: { type: Schema.Types.Mixed, default: {} },
    picture: { type: String, required: true },
  },
  { timestamps: true },
);

SubTypeSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const SubType = mongoose.model<ISubType>('SubType', SubTypeSchema);
