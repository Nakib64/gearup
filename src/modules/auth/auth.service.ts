import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

interface UserPayload {
  id: string;
  email: string;
  role: string;
  status: string;
}

// Generate Access Token
export const generateAccessToken = (user: UserPayload): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
  );
};

// Generate Refresh Token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );
};

// Register user
export const registerUser = async (data: { email: string; password: string; name: string; role: 'CUSTOMER' | 'PROVIDER' }) => {
  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError(400, 'User with this email already exists');
  }

  // 2. Hash password with bcrypt
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  // 3. Create user
  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      status: 'ACTIVE',
    },
  });

  // 4. Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// Login user
export const loginUser = async (data: { email: string; password: string }) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // 2. Check user status
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'Forbidden: Your account is suspended');
  }

  // 3. Compare password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  const refreshToken = generateRefreshToken(user.id);

  // 5. Return user without password and the tokens
  const { password, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

// Refresh token
export const refreshUserToken = async (token: string) => {
  // 1. Verify token
  let decoded: { id: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
  } catch (err) {
    throw new AppError(401, 'Unauthorized: Invalid or expired refresh token');
  }

  // 2. Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new AppError(401, 'Unauthorized: User no longer exists');
  }

  // 3. Check status
  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'Forbidden: Your account is suspended');
  }

  // 4. Generate new access token
  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  return {
    accessToken: newAccessToken,
  };
};
