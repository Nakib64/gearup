import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({
      message: 'Name is required',
    }).min(1, 'Name cannot be empty'),
    description: z.string().optional(),
  }),
});
