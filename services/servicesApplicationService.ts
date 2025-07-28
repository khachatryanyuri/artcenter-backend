import mongoose from 'mongoose';
import { ParsedQs } from 'qs';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { IServicesApplication, IServicesApplicationDocument } from '../interfaces/serviceApplicationInterface';
import { ServicesApplication } from '../models/servicesApplicationModel';

export class ServicesApplicationService {
  public async registerServicesApplication(servicesApplicationDetails: IServicesApplication): Promise<void> {
    const serviceApplication: IServicesApplication = new ServicesApplication(servicesApplicationDetails);
    await serviceApplication.save();
  }

  public async getAllServicesApplication(
    queryParams: ParsedQs,
  ): Promise<{ data: IServicesApplication[]; total: number }> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const servicesApplication = await ServicesApplication.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const total = filterObject.isServiceAvailable
      ? await ServicesApplication.countDocuments({ isServiceAvailable: true })
      : await ServicesApplication.countDocuments();

    return { data: servicesApplication, total };
  }

  public async getOneServicesApplication(serviceApplicationId: string): Promise<IServicesApplication> {
    if (!mongoose.Types.ObjectId.isValid(serviceApplicationId)) {
      throw new BadRequestError('Invalid service application ID');
    }
    const serviceApplication: IServicesApplication | null = await ServicesApplication.findById(serviceApplicationId);

    if (!serviceApplication) {
      throw new NotFoundError('Courses Application not found');
    }

    return serviceApplication;
  }

  public async updateServicesApplication(
    servicesApplicationDetails: IServicesApplication,
    serviceId: string,
  ): Promise<IServicesApplication> {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestError('Invalid services application ID');
    }

    const services: IServicesApplicationDocument | null = await ServicesApplication.findById(serviceId);

    if (!services) {
      throw new NotFoundError('Services Application not found');
    }

    Object.entries(servicesApplicationDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        services[key] = value;
      }
    });

    const updatedServices = await services.save();

    return updatedServices;
  }

  public async deleteServicesApplication(serviceId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestError('Invalid services application ID');
    }
    const deletedServices: IServicesApplication | null = await ServicesApplication.findByIdAndDelete(serviceId);

    if (!deletedServices) {
      throw new NotFoundError('Services Application not found');
    }
  }
}
