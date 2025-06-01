import { Document, Types as MongooseTypes } from 'mongoose';

export interface ITypes extends Document {
  key: string;
  title: any;
  desc: any;
  picture: string;
  subTypes: MongooseTypes.ObjectId[];
}

export interface ITypeDocument extends ITypes, Document {
  [key: string]: any;
}
