import mongoose from 'mongoose';
import https from 'https';
import { ParsedQs } from 'qs';

import { LessonPricing } from '../models/lessonPricingModel';
import { ILessonPricing } from '../interfaces/lessonPricingInterface';
import { BadRequestError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// ---------------------------------------------------------------------------
// In-memory exchange rate cache (server lifetime, refreshed every 24 hours)
// ---------------------------------------------------------------------------
const EXCHANGE_RATE_FALLBACK = 400;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

let cachedRate: number = EXCHANGE_RATE_FALLBACK;
let lastFetched: number = 0;

/**
 * Fetches the AMD/USD exchange rate from the Central Bank of Armenia (cb.am).
 * Caches the result in memory for 24 hours. Falls back to 400 on any error.
 */
async function fetchExchangeRate(): Promise<number> {
  if (Date.now() - lastFetched < CACHE_TTL_MS) {
    return cachedRate;
  }

  return new Promise((resolve) => {
    https
      .get('https://cb.am/latest.json.php', (res) => {
        let raw = '';
        res.on('data', (chunk: Buffer) => (raw += chunk.toString()));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (data && data.USD) {
              cachedRate = Number(data.USD);
              lastFetched = Date.now();
              logger.info(`Exchange rate refreshed: 1 USD = ${cachedRate} AMD`);
            }
          } catch (e) {
            logger.warn('Failed to parse exchange rate response, using cached/fallback value');
          }
          resolve(cachedRate);
        });
      })
      .on('error', (err) => {
        logger.warn(`Exchange rate fetch failed: ${err.message}. Using fallback ${EXCHANGE_RATE_FALLBACK}`);
        resolve(cachedRate);
      });
  });
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export class LessonPricingService {
  public async getExchangeRate(): Promise<number> {
    return fetchExchangeRate();
  }

  public async getAllPricing(queryParams: ParsedQs): Promise<{ data: ILessonPricing[]; total: number }> {
    const { sort, filter, range } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    // React-admin mapping: translate 'ids' array to MongoDB '_id: { $in: [...] }'
    if (filterObject.ids && Array.isArray(filterObject.ids)) {
      filterObject._id = { $in: filterObject.ids };
      delete filterObject.ids;
    }
    // Translate singular 'id' to '_id'
    if (filterObject.id) {
      filterObject._id = filterObject.id;
      delete filterObject.id;
    }

    const data = await LessonPricing.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : { createdAt: -1 })
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    const total = await LessonPricing.countDocuments(filterObject);
    return { data, total };
  }

  /**
   * Public endpoint consumed by the Next.js frontend.
   * Returns the pricing config for a given courseId + the current exchange rate.
   */
  public async getByCourseId(courseId: string): Promise<{ pricing: ILessonPricing; usdExchangeRate: number } | null> {
    const pricing = await LessonPricing.findOne({ courseId, isActive: true });
    if (!pricing) {
      return null;
    }
    const usdExchangeRate = await fetchExchangeRate();
    return { pricing, usdExchangeRate };
  }

  public async getById(id: string): Promise<ILessonPricing> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid pricing ID');
    }
    const pricing = await LessonPricing.findById(id);
    if (!pricing) {
      throw new NotFoundError('Pricing config not found');
    }
    return pricing;
  }

  public async createPricing(body: Partial<ILessonPricing>): Promise<ILessonPricing> {
    const pricing = new LessonPricing(body);
    return pricing.save();
  }

  public async updatePricing(id: string, body: Partial<ILessonPricing>): Promise<ILessonPricing> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid pricing ID');
    }
    const pricing = await LessonPricing.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    );
    if (!pricing) {
      throw new NotFoundError('Pricing config not found');
    }
    return pricing;
  }

  public async deletePricing(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid pricing ID');
    }
    const deleted = await LessonPricing.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('Pricing config not found');
    }
  }
}
