import mongoose from 'mongoose';
import fs from 'fs/promises';
import { ParsedQs } from 'qs';

import { Types } from '../models/typeModel';
import { ITypes, ITypeDocument } from '../interfaces/typesInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { Environment } from '../utils/env';
import { getImagePaths } from '../utils/helperse';

export class TypesService {
  public async registerTypes(typesDetails: ITypes, typeFile: Express.Multer.File): Promise<void> {
    if (!typeFile) {
      throw new BadRequestError('Types picture is required');
    }

    const filePath = Environment.staticFilePath + typeFile.filename;

    const types: ITypes = new Types({
      ...typesDetails,
      picture: filePath,
    });

    await types.save();
  }

  public async getAllTypes(queryParams: ParsedQs): Promise<{ data: ITypes[]; total: number }> {
    const { sort, filter, range, web_filter } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};
    const webFilter = web_filter ? JSON.parse(web_filter as string) : {};

    const types = await Types.find(web_filter ? { key: webFilter.key } : filterObject)
      .populate('subTypes')
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const filteredTypes = filterObject.subTypes
      ? types.filter((type) => type.subTypes.some((subType: any) => subType.key === filterObject.subTypes.$elemMatch.key))
      : types;

    const total = filteredTypes.length;

    return { data: filteredTypes, total };
  }

  public async getOneTypes(typeId: string): Promise<ITypes> {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new BadRequestError('Invalid type ID');
    }
    const types: ITypes | null = await Types.findById(typeId).populate('subTypes');

    if (!types) {
      throw new NotFoundError('Types not found');
    }

    return types;
  }

  public async updateTypes(typeDetails: ITypes, typeFile: Express.Multer.File, typeId: string): Promise<ITypes> {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new BadRequestError('Invalid type ID');
    }

    const types: ITypeDocument | null = await Types.findById(typeId);

    if (!types) {
      throw new NotFoundError('Types not found');
    }

    const oldPicturePath = types.picture;

    Object.entries(typeDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        types[key] = value;
      }
    });

    const filePaths = typeFile?.filename ? Environment.staticFilePath + typeFile.filename : undefined;

    types.picture = filePaths || oldPicturePath;
    const updatedTypes = await types.save();

    if (oldPicturePath && typeFile) {
      try {
        const iamgePath = getImagePaths(oldPicturePath);
        await fs.unlink(iamgePath as string);
      } catch (error) {
        throw new BadRequestError('Error deleting old picture');
      }
    }
    return updatedTypes;
  }

  public async deleteTypes(courseId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid type ID');
    }
    const deletedTypes: ITypes | null = await Types.findByIdAndDelete(courseId);

    if (!deletedTypes) {
      throw new NotFoundError('Types not found');
    }
    const picturePath = deletedTypes.picture;
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
