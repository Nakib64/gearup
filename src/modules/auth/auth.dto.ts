import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'Email is required',
    }).email('Invalid email address'),
    password: z.string({
      message: 'Password is required',
    }).min(6, 'Password must be at least 6 characters long'),
    name: z.string({
      message: 'Name is required',
    }).min(1, 'Name cannot be empty'),
    role: z.enum(['CUSTOMER', 'PROVIDER'], {
      message: "Role must be either 'CUSTOMER' or 'PROVIDER'",
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'Email is required',
    }).email('Invalid email address'),
    password: z.string({
      message: 'Password is required',
    }),
  }),
});
