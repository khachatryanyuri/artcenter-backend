import mongoose, { Schema } from 'mongoose';
import { ITypes } from '../interfaces/typesInterface';

const TypesSchema: Schema<ITypes> = new Schema<ITypes>(
  {
    key: { type: String, required: true },
    title: { type: Schema.Types.Mixed, default: {} },
    desc: { type: Schema.Types.Mixed, default: {} },
    picture: { type: String, required: true },
    subTypes: [{ type: Schema.Types.ObjectId, ref: 'SubType' }],
  },
  { timestamps: true },
);

TypesSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Types = mongoose.model<ITypes>('Types', TypesSchema);
