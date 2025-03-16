import { Document } from 'mongoose';

export interface IPage extends Document {
  name: string;
  keys: Record<string, string>;
}
