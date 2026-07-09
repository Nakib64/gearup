import { Router } from 'express';
import { handleCreateCategory, handleGetAllCategories } from './category.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import { createCategorySchema } from './category.dto.js';

const router = Router();

// POST /api/categories - Admin only
router.post(
  '/',
  auth,
  restrictTo('ADMIN'),
  validateRequest(createCategorySchema),
  handleCreateCategory
);

// GET /api/categories - Public
router.get('/', handleGetAllCategories);

export const categoryRoutes = router;
export default categoryRoutes;
