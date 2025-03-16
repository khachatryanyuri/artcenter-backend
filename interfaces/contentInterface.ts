import { Document } from 'mongoose';

export interface IContent extends Document {
  page: string;
  key: string;
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface IContentDocument extends IContent, Document {
  [key: string]: any;
}
