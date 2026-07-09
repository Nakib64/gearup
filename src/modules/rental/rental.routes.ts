import { Router } from 'express';
import {
  handleCreateRental,
  handleGetCustomerRentals,
  handleGetRentalById,
  handleGetProviderOrders,
  handleUpdateOrderStatus,
} from './rental.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import { createRentalSchema, updateOrderStatusSchema } from './rental.dto.js';

const customerRouter = Router();
const providerRouter = Router();

// Customer rental endpoints (mounted at /api/rentals)
customerRouter.post(
  '/',
  auth,
  restrictTo('CUSTOMER'),
  validateRequest(createRentalSchema),
  handleCreateRental
);

customerRouter.get(
  '/',
  auth,
  restrictTo('CUSTOMER'),
  handleGetCustomerRentals
);

customerRouter.get(
  '/:id',
  auth,
  restrictTo('CUSTOMER', 'PROVIDER'),
  handleGetRentalById
);

// Provider order endpoints (mounted at /api/provider/orders)
providerRouter.get(
  '/',
  auth,
  restrictTo('PROVIDER'),
  handleGetProviderOrders
);

providerRouter.patch(
  '/:id',
  auth,
  restrictTo('PROVIDER'),
  validateRequest(updateOrderStatusSchema),
  handleUpdateOrderStatus
);

export const rentalRoutes = customerRouter;
export const providerOrderRoutes = providerRouter;
