import { Router } from 'express';
import {
  handleGetAllGears,
  handleGetGearById,
  handleCreateGear,
  handleUpdateGear,
  handleDeleteGear,
} from './gear.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import {
  getGearQuerySchema,
  createGearSchema,
  updateGearSchema,
} from './gear.dto.js';

const publicRouter = Router();
const providerRouter = Router();

// Public routes for gear browsing
publicRouter.get(
  '/',
  validateRequest(getGearQuerySchema),
  handleGetAllGears
);
publicRouter.get('/:id', handleGetGearById);

// Provider routes for gear management
providerRouter.post(
  '/',
  auth,
  restrictTo('PROVIDER'),
  validateRequest(createGearSchema),
  handleCreateGear
);
providerRouter.put(
  '/:id',
  auth,
  restrictTo('PROVIDER'),
  validateRequest(updateGearSchema),
  handleUpdateGear
);
providerRouter.delete(
  '/:id',
  auth,
  restrictTo('PROVIDER'),
  handleDeleteGear
);

export const gearRoutes = publicRouter;
export const providerGearRoutes = providerRouter;
