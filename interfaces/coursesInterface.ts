import { Document } from 'mongoose';

export interface ICourses extends Document {
  title: Record<string, string>;
  description: Record<string, string>;
  content: Record<string, string>;
  payment: Record<string, { title: string; description: string }>;
  calendlyLink: string;
  startingDate: Date;
  isCourseAvailable: boolean;
  picture: string;
}

export interface ICoursesDocument extends ICourses, Document {
  [key: string]: any;
}
