import type { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import {
  createPaymentIntent,
  confirmPayment,
  getBillingHistory,
} from './payment.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/app-error.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');

// Create payment intent for an order (Customer only)
export const handleCreatePaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const { rentalOrderId } = req.body;
    const customerId = req.user.id;
    const result = await createPaymentIntent(rentalOrderId, customerId);
    sendResponse(res, 201, 'Payment intent created successfully', result);
  } catch (error) {
    next(error);
  }
};

// Confirm payment webhook or direct callback
export const handleConfirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    if (sig && webhookSecret) {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new AppError(
          400,
          'Webhook Error: Raw body not available for signature verification'
        );
      }
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig as string,
          webhookSecret
        );
      } catch (err: any) {
        throw new AppError(400, `Webhook Error: ${err.message}`);
      }
    } else {
      // Fallback for manual/mock confirmation testing
      event = req.body;
    }

    let rentalOrderId: string | undefined;
    let transactionId: string | undefined;

    // Handle standard Stripe webhook structure
    if (event && event.type) {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        rentalOrderId = paymentIntent.metadata?.rentalOrderId;
        transactionId = paymentIntent.id;
      } else {
        // Acknowledge receipt of other webhook events but take no action
        sendResponse(res, 200, `Webhook event received: ${event.type}`);
        return;
      }
    } else {
      // Direct body parameters (e.g. for testing)
      rentalOrderId = event.rentalOrderId;
      transactionId = event.transactionId;
    }

    if (!rentalOrderId || !transactionId) {
      throw new AppError(
        400,
        'Invalid payload: Missing rentalOrderId or transactionId'
      );
    }

    const result = await confirmPayment(rentalOrderId, transactionId);
    sendResponse(res, 200, 'Payment confirmed successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get billing history (Customer only)
export const handleGetBillingHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const customerId = req.user.id;
    const result = await getBillingHistory(customerId);
    sendResponse(res, 200, 'Billing records retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
