import { Router } from 'express';

import { LessonPricingController } from '../controllers/lessonPricingController';
import { authorize, PassportConfig } from '../utils/passport';
import { ROLE_ENUM } from '../interfaces/roleEnum';

const { ADMIN } = ROLE_ENUM;
const passportConfig = new PassportConfig();

export class LessonPricingRoutes {
  router: Router;
  public lessonPricingController: LessonPricingController = new LessonPricingController();

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    // ── Public routes ──────────────────────────────────────────────────────
    // IMPORTANT: specific string routes MUST be registered before /:id
    // to prevent Express from treating "exchange-rate" or "by-type" as ObjectIds.

    // Public endpoints
    // Note: static string routes must be registered before parameterized routes
    this.router.get('/pricing/exchange-rate', this.lessonPricingController.getExchangeRate);
    this.router.get('/pricing/by-course/:courseId', this.lessonPricingController.getByCourseId);

    // React Admin list endpoint
    this.router.get('/pricing', this.lessonPricingController.getAllPricing);

    // Returns a single pricing config by Mongo _id (for Admin CMS edit view)
    this.router.get('/pricing/:id', this.lessonPricingController.getById);

    // ── Admin-only routes ──────────────────────────────────────────────────
    this.router.post(
      '/pricing',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.lessonPricingController.createPricing,
    );

    this.router.put(
      '/pricing/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.lessonPricingController.updatePricing,
    );

    this.router.delete(
      '/pricing/:id',
      passportConfig.authenticateJwt,
      authorize([ADMIN]),
      this.lessonPricingController.deletePricing,
    );
  }
}
