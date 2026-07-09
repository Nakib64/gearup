import { Router } from 'express';
import {
  handleCreatePaymentIntent,
  handleConfirmPayment,
  handleGetBillingHistory,
  handleGetPaymentById,
} from './payment.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { restrictTo } from '../../shared/middlewares/roles.middleware.js';
import { createPaymentSchema } from './payment.dto.js';

const router = Router();

// Create a payment intent (Customer only)
router.post(
  '/create',
  auth,
  restrictTo('CUSTOMER'),
  validateRequest(createPaymentSchema),
  handleCreatePaymentIntent
);

// Confirm payment webhook (Public endpoint)
router.post('/confirm', handleConfirmPayment);

// Get payment details by ID (Customer / Provider)
router.get('/:id', auth, restrictTo('CUSTOMER', 'PROVIDER'), handleGetPaymentById);

// Get user's billing records list (Customer only)
router.get('/', auth, restrictTo('CUSTOMER'), handleGetBillingHistory);

export const paymentRoutes = router;
export const providerPaymentRoutes = router; // exporting router for registration
export default paymentRoutes;
