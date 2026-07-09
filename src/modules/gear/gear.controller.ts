import type { Request, Response, NextFunction } from 'express';
import {
  getAllGears,
  getGearById,
  createGear,
  updateGear,
  deleteGear,
} from './gear.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/app-error.js';

// Get all gear items (Public)
export const handleGetAllGears = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllGears(req.query as any);
    sendResponse(res, 200, 'Gear items retrieved successfully', result);
  } catch (error) { 
    next(error);
  }
};

// Get gear item by ID (Public)
export const handleGetGearById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await getGearById(id);
    sendResponse(res, 200, 'Gear item details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Create a new gear item (Provider only)
export const handleCreateGear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const providerId = req.user.id;
    const result = await createGear(req.body, providerId);
    sendResponse(res, 201, 'Gear item listing created successfully', result);
  } catch (error) {
    next(error);
  }
};

// Update a gear item (Provider only)
export const handleUpdateGear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const id = req.params.id as string;
    const providerId = req.user.id;
    const result = await updateGear(id, req.body, providerId);
    sendResponse(res, 200, 'Gear item listing updated successfully', result);
  } catch (error) {
    next(error);
  }
};

// Delete a gear item (Provider only)
export const handleDeleteGear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const id = req.params.id as string;
    const providerId = req.user.id;
    await deleteGear(id, providerId);
    sendResponse(res, 200, 'Gear item listing deleted successfully');
  } catch (error) {
    next(error);
  }
};
