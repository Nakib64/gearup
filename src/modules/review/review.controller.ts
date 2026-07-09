import type { Request, Response, NextFunction } from 'express';
import { createReview } from './review.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/app-error.js';

export const handleCreateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const customerId = req.user.id;
    const result = await createReview(customerId, req.body);
    sendResponse(res, 201, 'Review submitted successfully', result);
  } catch (error) {
    next(error);
  }
};
