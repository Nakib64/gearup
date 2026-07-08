import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';

export const restrictTo = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized: User is not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(403, 'Forbidden: Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
