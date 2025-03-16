import { Content } from '../../models/contentModel';
import { Language } from '../../models/languageModel';

export const notEmptyObject = (obj: { [key: string]: string }): boolean => {
  for (const key in obj) {
    if (typeof obj[key] !== 'string') {
      return false;
    }
    if (obj[key].trim() !== '') {
      return true;
    }
  }
  return false;
};

export const uniqueCode = async (value: string) => {
  const existingLanguage = await Language.findOne({ code: value });
  if (existingLanguage) {
    throw new Error('Code already exists');
  }
  return true;
};

export const uniqueContentKey = async (value: string, id: string | undefined) => {
  const existingKey = await Content.findOne({ key: value });

  if (!existingKey || (id && existingKey._id.toString() === id)) {
    return true;
  } else {
    throw new Error('This key already exists');
  }
};

export const hyNotEmpty = (value: { [key: string]: string }) => {
  if (!value || typeof value !== 'object' || !value.arm || value.arm.trim() === '') {
    throw new Error('Title or description must have a non-empty "arm" key.');
  }
  return true;
};
