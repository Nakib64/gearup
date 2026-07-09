import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    rentalOrderId: z.string({
      message: 'Rental Order ID is required',
    }).uuid('Rental Order ID must be a valid UUID'),
  }),
});
