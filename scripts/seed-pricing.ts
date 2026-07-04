/**
 * scripts/seed-pricing.ts
 *
 * One-off idempotent seeding script for the LessonPricing collection.
 *
 * Safe to run multiple times — uses updateOne with { upsert: true }
 * keyed on `courseTypeKey`, so no duplicates are ever created.
 *
 * How to run (see README or package.json "seed" script):
 *   npx tsc && node build/scripts/seed-pricing.js
 *
 * Or using the package.json shortcut:
 *   npm run seed
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env before anything else — do NOT import Environment here because
// that class calls process.exit(1) on any missing var (e.g. SMTP_HOST),
// which would abort the script even though those vars are irrelevant.
dotenv.config();

import { LessonPricing } from '../models/lessonPricingModel';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PricingDuration {
  duration: 30 | 45 | 60;
  priceAMD: number;
}

interface PricingTier {
  participantCount: number;
  durations: PricingDuration[];
}

interface Discount {
  condition: string;
  percentage: number;
}

interface PricingSection {
  title: Record<string, string>;
  description?: Record<string, string>;
  levels?: string[];
  tiers: PricingTier[];
}

interface SeedRecord {
  courseId?: mongoose.Types.ObjectId;
  label: Record<string, string>;
  sections: PricingSection[];
  discounts: Discount[];
  isActive: boolean;
}

// ─── Shared discounts (applied to every course) ────────────────────────────

const SHARED_DISCOUNTS: Discount[] = [
  { condition: 'fullCourse', percentage: 5 },
  { condition: '8lessons',   percentage: 3 },
];

// ─── Comprehensive Pricing Template ─────────────────────────────────────────
// Every course will receive this unified pricing menu with all sections.

const FULL_PRICING_TEMPLATE: Omit<SeedRecord, 'courseId' | 'label'> = {
  sections: [
    {
      title: {
        hy: '1. Հիմնական դասընթաց',
        ru: '1. Базовый курс',
        en: '1. Main Course',
      },
      description: {
        hy: 'Ուսուցումը իրականացվում է անհատական ծրագրերով',
        ru: 'Обучение проводится по индивидуальным программам',
        en: 'Training is conducted according to individual programs',
      },
      levels: ['A', 'B', 'C'],
      tiers: [
        {
          participantCount: 1,
          durations: [
            { duration: 45, priceAMD: 10000 },
          ],
        },
      ],
    },
    {
      title: {
        hy: '2. Խորացված դասընթաց',
        ru: '2. Углублённый курс',
        en: '2. Advanced Course',
      },
      description: {
        hy: 'Դասընթացի տևողությունը որոշվում է ուսանողի նպատակների հիման վրա:',
        ru: 'Продолжительность курса определяется исходя из целей студента:',
        en: 'The duration of the course is determined based on the student\'s goals:',
      },
      tiers: [
        {
          participantCount: 1,
          durations: [
            { duration: 30, priceAMD: 8000  },
            { duration: 45, priceAMD: 10000 },
            { duration: 60, priceAMD: 12000 },
          ],
        },
      ],
    },
    {
      title: {
        hy: '3. Անհատական դասեր',
        ru: '3. Индивидуальные занятия',
        en: '3. Individual Lessons',
      },
      tiers: [
        {
          participantCount: 1,
          durations: [
            { duration: 30, priceAMD: 8000  },
            { duration: 45, priceAMD: 10000 },
            { duration: 60, priceAMD: 12000 },
          ],
        },
      ],
    },
    {
      title: {
        hy: '4. Խմբային դասեր',
        ru: '4. Групповые занятия',
        en: '4. Group Lessons',
      },
      tiers: [
        {
          participantCount: 2,
          durations: [
            { duration: 30, priceAMD: 5600 },
            { duration: 45, priceAMD: 7200 },
            { duration: 60, priceAMD: 8800 },
          ],
        },
        {
          participantCount: 3,
          durations: [
            { duration: 30, priceAMD: 4800 },
            { duration: 45, priceAMD: 6000 },
            { duration: 60, priceAMD: 7200 },
          ],
        },
      ],
    },
  ],
  discounts: SHARED_DISCOUNTS,
  isActive: true,
};

// ─── Main ───────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set in .env — aborting.');
    process.exit(1);
  }

  console.log('\n🌱  Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅  Connected.\n');

  // Load the Courses model dynamically so we can query it
  const CoursesModel = mongoose.connection.model<any>('Courses', new mongoose.Schema({}, { strict: false }));
  const courses = await CoursesModel.find({});
  console.log(`Found ${courses.length} courses in the database.`);

  // Drop the old index left over from before the refactor
  try {
    await LessonPricing.collection.dropIndex('courseTypeKey_1');
    console.log('🗑️   Dropped old courseTypeKey_1 index.');
  } catch (e) {
    // Ignore if it doesn't exist
  }

  let upserted = 0;
  let unchanged = 0;

  for (const course of courses) {
    const typesKey = course.typesKey;
    // We only apply pricing to active 'curses' (which are standard courses)
    // and skip 'services' like Lyrics, Master classes, etc.
    if (typesKey === 'services') {
      console.log(`  ──  Skipping service "${course.title?.en || course._id}"`);
      continue;
    }

    const record = { ...FULL_PRICING_TEMPLATE } as SeedRecord;
    record.courseId = course._id;
    record.label = course.title || { hy: '', ru: '', en: '' };

    const result = await LessonPricing.updateOne(
      { courseId: record.courseId }, // filter — unique key is now courseId
      { $set: record },              // update — full replacement of fields
      { upsert: true },              // insert if not found
    );

    const wasInserted  = result.upsertedCount > 0;
    const wasModified  = result.modifiedCount > 0;

    if (wasInserted) {
      console.log(`  ➕  Inserted pricing for "${course.title?.en || course._id}" (courseId: ${record.courseId})`);
      upserted++;
    } else if (wasModified) {
      console.log(`  ✏️   Updated  pricing for "${course.title?.en || course._id}" (courseId: ${record.courseId})`);
      upserted++;
    } else {
      console.log(`  ──  No change for "${course.title?.en || course._id}" (courseId: ${record.courseId}) — already up to date`);
      unchanged++;
    }
  }

  console.log(`\n✅  Done. ${upserted} upserted, ${unchanged} unchanged.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
