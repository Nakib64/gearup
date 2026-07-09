import type { Request, Response, NextFunction } from 'express';
import { createCategory, getAllCategories } from './category.service.js';
import { sendResponse } from '../../shared/utils/response.js';

// Create a new category
export const handleCreateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await createCategory(req.body);
    sendResponse(res, 201, 'Category created successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get all categories
export const handleGetAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getAllCategories();
    sendResponse(res, 200, 'Categories retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
