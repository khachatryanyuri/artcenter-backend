import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

import { IUser } from '../interfaces/userInterface';

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    name: {
      type: Schema.Types.Mixed,
      default: {},
    },
    surname: {
      type: Schema.Types.Mixed,
      default: {},
    },
    birthday: {
      type: Date,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: Schema.Types.Mixed,
      default: {},
    },
    picture: {
      type: String,
    },
    resetToken: String,
    resetTokenExpiry: Number,
    role: {
      type: String,
      required: true,
      default: 'user',
    },
  },
  { timestamps: true },
);

UserSchema.pre<IUser>('save', async function (next) {
  const user = this;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  // Generate a salt
  const salt = await bcrypt.genSalt(10);

  // Hash the password
  const hashedPassword = await bcrypt.hash(user.password, salt);

  // Set the password property on the user model to the hashed value
  user.password = hashedPassword;

  next();
});

UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
