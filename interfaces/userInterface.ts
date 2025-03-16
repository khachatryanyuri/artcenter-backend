import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: Record<string, string>;
  surname: Record<string, string>;
  birthday: Date;
  phoneNumber: string;
  address: Record<string, string>;
  picture?: string;
  role: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface IUserGoogle extends Document {
  email: string;
  password?: string;
  name: Record<string, string>;
  surname: Record<string, string>;
  birthday: Date;
  phoneNumber?: string;
  address?: Record<string, string>;
  picture?: string;
  role: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export interface IUserDocument extends IUser, Document {
  [key: string]: any;
}
