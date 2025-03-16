import mongoose from 'mongoose';
import fs from 'fs/promises';
import { ParsedQs } from 'qs';

import { Courses } from '../models/coursesModel';
import { ICourses, ICoursesDocument } from '../interfaces/coursesInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { Environment } from '../utils/env';
import { getImagePaths, parseContent } from '../utils/helperse';

export class CoursesService {
  public async registerCourses(coursesDetails: ICourses, courseFile: Express.Multer.File): Promise<void> {
    if (!courseFile) {
      throw new BadRequestError('Course picture is required');
    }

    const parsedContent = parseContent(coursesDetails.content);

    const filePath = Environment.staticFilePath + courseFile.filename;

    const courses: ICourses = new Courses({
      ...coursesDetails,
      picture: filePath,
      content: parsedContent,
    });

    await courses.save();
  }

  public async getAllCourses(queryParams: ParsedQs): Promise<{ data: ICourses[]; total: number }> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const courses = await Courses.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const total = filterObject.isCourseAvailable
      ? await Courses.countDocuments({ isCourseAvailable: true })
      : await Courses.countDocuments();

    return { data: courses, total };
  }

  public async getOneCourses(courseId: string): Promise<ICourses> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid courses ID');
    }
    const courses: ICourses | null = await Courses.findById(courseId);

    if (!courses) {
      throw new NotFoundError('Courses not found');
    }

    return courses;
  }

  public async updateCourses(
    coursesDetails: ICourses,
    courseFile: Express.Multer.File,
    courseId: string,
  ): Promise<ICourses> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid courses ID');
    }

    const courses: ICoursesDocument | null = await Courses.findById(courseId);

    const parsedContent = parseContent(coursesDetails.content);

    if (!courses) {
      throw new NotFoundError('Courses not found');
    }

    const oldPicturePath = courses.picture;

    Object.entries(coursesDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'registeredPersons') {
        courses[key] = value;
      }
    });

    const filePaths = courseFile?.filename ? Environment.staticFilePath + courseFile.filename : undefined;

    courses.picture = filePaths || oldPicturePath;
    courses.content = parsedContent;
    const updatedCourses = await courses.save();

    if (oldPicturePath && courseFile) {
      try {
        const iamgePath = getImagePaths(oldPicturePath);
        await fs.unlink(iamgePath as string);
      } catch (error) {
        throw new BadRequestError('Error deleting old picture');
      }
    }
    return updatedCourses;
  }

  public async deleteCourses(courseId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid courses ID');
    }
    const deletedCourses: ICourses | null = await Courses.findByIdAndDelete(courseId);

    if (!deletedCourses) {
      throw new NotFoundError('Courses not found');
    }
    const picturePath = deletedCourses.picture;
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
