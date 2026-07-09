import { Router } from 'express';
import { handleCreateReview } from './review.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import { createReviewSchema } from './review.dto.js';

const router = Router();

// POST /api/reviews - Customer Only
router.post(
  '/',
  auth,
  restrictTo('CUSTOMER'),
  validateRequest(createReviewSchema),
  handleCreateReview
);

export const reviewRoutes = router;
export default reviewRoutes;
