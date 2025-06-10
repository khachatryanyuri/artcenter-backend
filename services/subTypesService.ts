import mongoose from 'mongoose';
import fs from 'fs/promises';
import { ParsedQs } from 'qs';

import { SubType, ISubType, ISubTypeDocument } from '../models/subTypeModel';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { Environment } from '../utils/env';
import { getImagePaths, parseSubType } from '../utils/helperse';

export class SubTypesService {
  public async registerSubTypes(subTypesDetails: ISubType, typeFile: Express.Multer.File): Promise<void> {
    if (!typeFile) {
      throw new BadRequestError('Sub Types picture is required');
    }

    const filePath = Environment.staticFilePath + typeFile.filename;
    let parsedType = parseSubType(subTypesDetails.type);
    const subTypes: ISubType = new SubType({
      ...subTypesDetails,
      type: parsedType,
      picture: filePath,
    });

    await subTypes.save();
  }

  public async getAllSubTypes(queryParams: ParsedQs): Promise<{ data: ISubType[]; total: number }> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const subTypes = await SubType.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const total = await SubType.countDocuments();

    return { data: subTypes, total };
  }

  public async getOneSubTypes(typeId: string): Promise<ISubType> {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new BadRequestError('Invalid type ID');
    }
    const subTypes: ISubType | null = await SubType.findById(typeId);

    if (!subTypes) {
      throw new NotFoundError('Sub Types not found');
    }

    return subTypes;
  }

  public async updateSubTypes(typeDetails: ISubType, typeFile: Express.Multer.File, typeId: string): Promise<ISubType> {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new BadRequestError('Invalid type ID');
    }

    const subTypes: ISubTypeDocument | null = await SubType.findById(typeId);

    if (!subTypes) {
      throw new NotFoundError('Sub Types not found');
    }

    const oldPicturePath = subTypes.picture;

    Object.entries(typeDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        subTypes[key] = value;
      }
    });
    let parsedType = parseSubType(typeDetails.type);
    const filePaths = typeFile?.filename ? Environment.staticFilePath + typeFile.filename : undefined;

    subTypes.picture = filePaths || oldPicturePath;
    subTypes.type = parsedType;
    const updatedSubTypes = await subTypes.save();

    if (oldPicturePath && typeFile) {
      try {
        const iamgePath = getImagePaths(oldPicturePath);
        await fs.unlink(iamgePath as string);
      } catch (error) {
        throw new BadRequestError('Error deleting old picture');
      }
    }
    return updatedSubTypes;
  }

  public async deleteSubTypes(courseId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid type ID');
    }
    const deletedSubTypes: ISubType | null = await SubType.findByIdAndDelete(courseId);

    if (!deletedSubTypes) {
      throw new NotFoundError('Sub Types not found');
    }
    const picturePath = deletedSubTypes.picture;
    if (picturePath) {
      try {
        const iamgePath = getImagePaths(picturePath);
        await fs.unlink(iamgePath as string);
      } catch (error) {
        throw new BadRequestError('Error deleting picture');
      }
    }
  }
}
