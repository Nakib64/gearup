import type { Request, Response, NextFunction } from 'express';
import {
  getAllUsers,
  updateUserStatus,
  getAllGearsAdmin,
  getAllRentalsAdmin,
} from './admin.service.js';
import { sendResponse } from '../../shared/utils/response.js';

// Get all users (Admin only)
export const handleGetAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllUsers();
    sendResponse(res, 200, 'All registered users retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Update user status (Admin only)
export const handleUpdateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id as string;
    const { status } = req.body;
    const result = await updateUserStatus(userId, status);
    sendResponse(
      res,
      200,
      `User status updated to ${status} successfully`,
      result
    );
  } catch (error) {
    next(error);
  }
};

// Get all gear listings (Admin only)
export const handleGetAllGearsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllGearsAdmin();
    sendResponse(res, 200, 'All catalog gear listings retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get all rental orders (Admin only)
export const handleGetAllRentalsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllRentalsAdmin();
    sendResponse(res, 200, 'All rental orders retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
