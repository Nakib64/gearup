import Stripe from 'stripe';
import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');

export const createPaymentIntent = async (rentalOrderId: string, customerId: string) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: { payments: true },
  });

  if (!order) {
    throw new AppError(404, 'Rental order not found');
  }

  if (order.customerId !== customerId) {
    throw new AppError(403, 'Forbidden: You do not own this rental order');
  }

  if (order.status === 'PAID') {
    throw new AppError(400, 'This rental order has already been paid');
  }

  const completedPayment = order.payments.find((p) => p.status === 'COMPLETED');
  if (completedPayment) {
    throw new AppError(400, 'This rental order has already been paid');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError(500, 'Stripe secret key is not configured in environment variables');
  }

  // Stripe amount is in cents
  const amountInCents = Math.round(order.totalPrice * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      rentalOrderId,
    },
  });

  // Create payment record in PENDING status
  await prisma.payment.create({
    data: {
      rentalOrderId,
      transactionId: paymentIntent.id,
      amount: order.totalPrice,
      method: 'STRIPE',
      status: 'PENDING',
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    transactionId: paymentIntent.id,
  };
};

export const confirmPayment = async (rentalOrderId: string, transactionId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.rentalOrder.findUnique({
      where: { id: rentalOrderId },
    });

    if (!order) {
      throw new AppError(404, 'Rental order not found');
    }

    // Upsert the payment record
    await tx.payment.upsert({
      where: { transactionId },
      create: {
        rentalOrderId,
        transactionId,
        amount: order.totalPrice,
        method: 'STRIPE',
        status: 'COMPLETED',
        paidAt: new Date(),
      },
      update: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });

    // Update rental order status to PAID
    return await tx.rentalOrder.update({
      where: { id: rentalOrderId },
      data: {
        status: 'PAID',
      },
    });
  });
};

export const getBillingHistory = async (customerId: string) => {
  return await prisma.payment.findMany({
    where: {
      rentalOrder: {
        customerId,
      },
    },
    include: {
      rentalOrder: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
