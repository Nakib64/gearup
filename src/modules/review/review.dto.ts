import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rentalOrderId: z.string({
      message: 'Rental Order ID is required',
    }).uuid('Rental Order ID must be a valid UUID'),
    gearItemId: z.string({
      message: 'Gear Item ID is required',
    }).uuid('Gear Item ID must be a valid UUID'),
    rating: z.number({
      message: 'Rating is required',
    }).int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().optional(),
  }),
});
