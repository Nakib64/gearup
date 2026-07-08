import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, refreshUserToken } from './auth.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/app-error.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

// Register user
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    sendResponse(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, 200, 'Login successful', { user });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new AppError(401, 'Unauthorized: Refresh token is missing');
    }

    const { accessToken } = await refreshUserToken(token);

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    sendResponse(res, 200, 'Access token refreshed successfully', null);
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    sendResponse(res, 200, 'Logout successful', null);
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized: User is not authenticated');
    }
    sendResponse(res, 200, 'User profile retrieved successfully', req.user);
  } catch (error) {
    next(error);
  }
};
