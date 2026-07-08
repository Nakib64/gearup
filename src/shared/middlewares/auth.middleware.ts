import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error.js';
import { prisma } from '../prisma.service.js';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        status: string;
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Get token from cookies or authorization header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError(401, 'Unauthorized: Access token is missing');
    }

    // 2. Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as DecodedToken;
    } catch (err) {
      throw new AppError(401, 'Unauthorized: Access token is invalid or expired');
    }

    // 3. Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AppError(401, 'Unauthorized: User no longer exists');
    }

    // 4. Check if user is suspended
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Forbidden: Your account is suspended');
    }

    // 5. Grant access
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};
