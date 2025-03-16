import mongoose from 'mongoose';
import { ParsedQs } from 'qs';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { IContent } from '../interfaces/contentInterface';
import { IPage } from '../interfaces/pagesInterface';
import { Content } from '../models/contentModel';
import { Pages } from '../models/pagesModel';

export class ContentService {
  public async createContent(contentDetails: IContent): Promise<void> {
    const content: IContent = new Content(contentDetails);
    await content.save();
  }

  public async getAllContent(queryParams: ParsedQs): Promise<IContent[]> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const content = await Content.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    return content;
  }

  public async getAllPages(queryParams: ParsedQs): Promise<IPage[]> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const pages = await Pages.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    return pages;
  }

  public async getOneContent(contentId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new BadRequestError('Invalid Content ID');
    }
    const content: IContent | null = await Content.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content not found');
    }
    return content;
  }

  public async updateContent(contentDetails: IContent, contentId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new BadRequestError('Invalid Content ID');
    }

    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { $set: contentDetails },
      { new: true, runValidators: true },
    );

    if (!updatedContent) {
      throw new NotFoundError('Content not found');
    }

    return updatedContent;
  }

  public async deleteContent(contentId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new BadRequestError('Invalid Content ID');
    }
    const deletedContent: IContent | null = await Content.findByIdAndDelete(contentId);

    if (!deletedContent) {
      throw new NotFoundError('Content not found');
    }
  }
}
