import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    where: {
      role: { in: ['CUSTOMER', 'PROVIDER'] },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateUserStatus = async (
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED'
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new AppError(400, 'Admin accounts cannot be suspended or activated');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });
};

export const getAllGearsAdmin = async () => {
  return await prisma.gearItem.findMany({
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getAllRentalsAdmin = async () => {
  return await prisma.rentalOrder.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              title: true,
              brand: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          transactionId: true,
          amount: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
