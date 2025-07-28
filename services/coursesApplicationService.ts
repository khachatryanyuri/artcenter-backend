import mongoose from 'mongoose';
import fs from 'fs/promises';
import { ParsedQs } from 'qs';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { ICoursesApplication, ICoursesApplicationDocument } from '../interfaces/courseApplicationInterface';
import { CoursesApplication } from '../models/coursesApplicationModel';

export class CoursesApplicationService {
  public async registerCoursesApplication(coursesApplicationDetails: ICoursesApplication): Promise<void> {
    const courses: ICoursesApplication = new CoursesApplication(coursesApplicationDetails);
    await courses.save();
  }

  public async getAllCoursesApplication(
    queryParams: ParsedQs,
  ): Promise<{ data: ICoursesApplication[]; total: number }> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const coursesApplication = await CoursesApplication.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const total = filterObject.isCourseAvailable
      ? await CoursesApplication.countDocuments({ isCourseAvailable: true })
      : await CoursesApplication.countDocuments();

    return { data: coursesApplication, total };
  }

  public async getOneCoursesApplication(courseApplicationId: string): Promise<ICoursesApplication> {
    if (!mongoose.Types.ObjectId.isValid(courseApplicationId)) {
      throw new BadRequestError('Invalid course application ID');
    }
    const coursesApplication: ICoursesApplication | null = await CoursesApplication.findById(courseApplicationId);

    if (!coursesApplication) {
      throw new NotFoundError('Courses Application not found');
    }

    return coursesApplication;
  }

  public async updateCoursesApplication(
    coursesApplicationDetails: ICoursesApplication,
    courseId: string,
  ): Promise<ICoursesApplication> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid courses application ID');
    }

    const courses: ICoursesApplicationDocument | null = await CoursesApplication.findById(courseId);

    if (!courses) {
      throw new NotFoundError('Courses Application not found');
    }

    Object.entries(coursesApplicationDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        courses[key] = value;
      }
    });

    const updatedCourses = await courses.save();

    return updatedCourses;
  }

  public async deleteCoursesApplication(courseId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError('Invalid courses application ID');
    }
    const deletedCourses: ICoursesApplication | null = await CoursesApplication.findByIdAndDelete(courseId);

    if (!deletedCourses) {
      throw new NotFoundError('Courses Application not found');
    }
  }
}
