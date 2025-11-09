import { Document } from 'mongoose';

export interface ICourses extends Document {
  title: Record<string, string>;
  description: Record<string, string>;
  typesKey: string;
  subTypesKey: string;
  subTypesThemeKey: string;
  isCourseAvailable: boolean;
  picture: string;
  typeKey?: string;
}

export interface ICoursesDocument extends ICourses, Document {
  [key: string]: any;
}
