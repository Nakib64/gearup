import { z } from 'zod';

export const createRentalSchema = z.object({
  body: z.object({
    startDate: z.string({
      message: 'Start date is required',
    }).refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }),
    endDate: z.string({
      message: 'End date is required',
    }).refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }),
    items: z.array(
      z.object({
        gearItemId: z.string({
          message: 'Gear Item ID is required',
        }).uuid('Gear Item ID must be a valid UUID'),
        quantity: z.number({
          message: 'Quantity is required',
        }).int().positive('Quantity must be a positive integer'),
      }),
      {
        message: 'Items list is required',
      }
    ).min(1, 'At least one gear item must be specified'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED'], {
      message: "Status must be 'CONFIRMED', 'PICKED_UP', 'RETURNED', or 'CANCELLED'",
    }),
  }),
});
