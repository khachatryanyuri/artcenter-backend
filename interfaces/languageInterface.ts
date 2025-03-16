// Language.ts
import { Document } from 'mongoose';

interface ILanguage extends Document {
  code: string;
}

export default ILanguage;
