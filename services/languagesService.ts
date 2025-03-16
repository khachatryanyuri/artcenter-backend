import mongoose from 'mongoose';
import { ParsedQs } from 'qs';

import ILanguage from '../interfaces/languageInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { Language } from '../models/languageModel';

export class LanguageService {
  public async registerLanguage(memberDetails: ILanguage): Promise<void> {
    const { code } = memberDetails;
    const language: ILanguage = new Language({
      code,
    });

    await language.save();
  }

  public async getAllLanguages(queryParams: ParsedQs): Promise<ILanguage[]> {
    const { sort, range, filter } = queryParams;
    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const lanuage = await Language.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    return lanuage;
  }

  public async getLanguageById(languageId: string): Promise<ILanguage | null> {
    if (!mongoose.Types.ObjectId.isValid(languageId)) {
      throw new BadRequestError('Invalid Language ID');
    }
    const language: ILanguage | null = await Language.findById(languageId);

    if (!language) {
      throw new NotFoundError('Language not found');
    }
    return language;
  }

  public async deleteLanguageById(languageId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(languageId)) {
      throw new BadRequestError('Invalid language ID');
    }
    const deleteLanguage: ILanguage | null = await Language.findByIdAndDelete(languageId);

    if (!deleteLanguage) {
      throw new NotFoundError('Language not found');
    }
  }
}
