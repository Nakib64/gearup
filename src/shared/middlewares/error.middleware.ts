import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { ZodError } from 'zod';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorDetails: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = err.issues;
  } else if (err && typeof err === 'object' && 'code' in err && err.constructor.name.includes('Prisma')) {
    statusCode = 400;
    message = 'Database operation failed';
    errorDetails = err;
  } else if (err instanceof Error) {
    message = err.message;
    errorDetails = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
