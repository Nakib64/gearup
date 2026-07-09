import { z } from 'zod';

export const getGearQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? parseFloat(val as string) : undefined),
      z.number().nonnegative('minPrice must be a non-negative number').optional()
    ),
    maxPrice: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? parseFloat(val as string) : undefined),
      z.number().nonnegative('maxPrice must be a non-negative number').optional()
    ),
    search: z.string().optional(),
    limit: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? parseInt(val as string, 10) : undefined),
      z.number().int().positive('limit must be a positive integer').optional()
    ),
    page: z.preprocess(
      (val) => (val !== undefined && val !== null && val !== '' ? parseInt(val as string, 10) : undefined),
      z.number().int().positive('page must be a positive integer').optional()
    ),
  }),
});

export const createGearSchema = z.object({
  body: z.object({
    title: z.string({
      message: 'Title is required',
    }).min(1, 'Title cannot be empty'),
    description: z.string({
      message: 'Description is required',
    }).min(1, 'Description cannot be empty'),
    pricePerDay: z.number({
      message: 'Price per day is required',
    }).positive('Price per day must be a positive number'),
    brand: z.string({
      message: 'Brand is required',
    }).min(1, 'Brand cannot be empty'),
    stock: z.number({
      message: 'Stock is required',
    }).int().nonnegative('Stock must be a non-negative integer'),
    categoryId: z.string({
      message: 'Category ID is required',
    }).uuid('Category ID must be a valid UUID'),
  }),
});

export const updateGearSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    pricePerDay: z.number().positive('Price per day must be a positive number').optional(),
    brand: z.string().min(1, 'Brand cannot be empty').optional(),
    stock: z.number().int().nonnegative('Stock must be a non-negative integer').optional(),
    categoryId: z.string().uuid('Category ID must be a valid UUID').optional(),
  }),
});
