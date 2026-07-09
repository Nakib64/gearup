import { Router } from 'express';
import {
  handleGetAllUsers,
  handleUpdateUserStatus,
  handleGetAllGearsAdmin,
  handleGetAllRentalsAdmin,
} from './admin.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import { updateUserStatusSchema } from './admin.dto.js';

const router = Router();

// Apply admin-only protection globally to all admin routes
router.use(auth, restrictTo('ADMIN'));

// GET /api/admin/users
router.get('/users', handleGetAllUsers);

// PATCH /api/admin/users/:id
router.patch(
  '/users/:id',
  validateRequest(updateUserStatusSchema),
  handleUpdateUserStatus
);

// GET /api/admin/gear
router.get('/gear', handleGetAllGearsAdmin);

// GET /api/admin/rentals
router.get('/rentals', handleGetAllRentalsAdmin);

export const adminRoutes = router;
export default adminRoutes;
