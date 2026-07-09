import type { Request, Response, NextFunction } from 'express';
import {
  createRental,
  getCustomerRentals,
  getRentalById,
  getProviderOrders,
  updateOrderStatus,
} from './rental.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/app-error.js';

// Create a new rental order (Customer only)
export const handleCreateRental = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const customerId = req.user.id;
    const result = await createRental(customerId, req.body);
    sendResponse(res, 201, 'Rental order created successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get customer's rental history (Customer only)
export const handleGetCustomerRentals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const customerId = req.user.id;
    const result = await getCustomerRentals(customerId);
    sendResponse(res, 200, 'Rental history retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get rental order details by ID (Customer / Owner Provider)
export const handleGetRentalById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const id = req.params.id as string;
    const userId = req.user.id;
    const role = req.user.role;
    const result = await getRentalById(id, userId, role);
    sendResponse(res, 200, 'Rental order details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Get incoming orders for provider (Provider only)
export const handleGetProviderOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    const providerId = req.user.id;
    const result = await getProviderOrders(providerId);
    sendResponse(res, 200, 'Incoming provider orders retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

// Update order status (Provider only)
export const handleUpdateOrderStatus = async (
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
    const { status } = req.body;
    const result = await updateOrderStatus(id, status, providerId);
    sendResponse(res, 200, 'Rental order status updated successfully', result);
  } catch (error) {
    next(error);
  }
};
