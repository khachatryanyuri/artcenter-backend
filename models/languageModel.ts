import mongoose from 'mongoose';

import ILanguage from '../interfaces/languageInterface';

const languageSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
});

languageSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const Language = mongoose.model<ILanguage>('Language', languageSchema);
