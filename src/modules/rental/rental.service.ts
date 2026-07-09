import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

export const createRental = async (
  customerId: string,
  data: {
    startDate: string;
    endDate: string;
    items: { gearItemId: string; quantity: number; numberOfDays: number }[];
  }
) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (start.getTime() >= end.getTime()) {
    throw new AppError(400, 'End date must be after start date');
  }

  // Extract gear item IDs
  const gearItemIds = data.items.map((i) => i.gearItemId);

  // Fetch all gear items to check existence, price, and stock
  const gearItems = await prisma.gearItem.findMany({
    where: {
      id: { in: gearItemIds },
    },
  });

  if (gearItems.length !== gearItemIds.length) {
    throw new AppError(404, 'One or more gear items could not be found');
  }

  let totalPrice = 0;
  const itemsWithPrice = data.items.map((reqItem) => {
    const gear = gearItems.find((g) => g.id === reqItem.gearItemId)!;

    if (gear.stock < reqItem.quantity) {
      throw new AppError(
        400,
        `Insufficient stock for gear item: ${gear.title}. Available: ${gear.stock}, Requested: ${reqItem.quantity}`
      );
    }

    const itemTotal = gear.pricePerDay * reqItem.quantity * reqItem.numberOfDays;
    totalPrice += itemTotal;

    return {
      gearItemId: reqItem.gearItemId,
      quantity: reqItem.quantity,
      numberOfDays: reqItem.numberOfDays,
      pricePerDay: gear.pricePerDay,
    };
  });

  // Execute transaction to decrement stock and create the rental order
  const rentalOrder = await prisma.$transaction(async (tx) => {
    // 1. Decrement stock for all items
    for (const reqItem of data.items) {
      const updatedGear = await tx.gearItem.update({
        where: { id: reqItem.gearItemId },
        data: {
          stock: {
            decrement: reqItem.quantity,
          },
        },
      });

      if (updatedGear.stock < 0) {
        throw new AppError(
          400,
          `Concurrent update failed: Insufficient stock for ${updatedGear.title}`
        );
      }
    }

    // 2. Create the rental order and items
    return await tx.rentalOrder.create({
      data: {
        customerId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'PLACED',
        rentalItems: {
          create: itemsWithPrice.map((item) => ({
            gearItemId: item.gearItemId,
            quantity: item.quantity,
            numberOfDays: item.numberOfDays,
            pricePerDay: item.pricePerDay,
          })),
        },
      },
      include: {
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
      },
    });
  });

  return rentalOrder;
};

export const getCustomerRentals = async (customerId: string) => {
  return await prisma.rentalOrder.findMany({
    where: { customerId },
    include: {
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
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getRentalById = async (id: string, userId: string, role: string) => {
  const rental = await prisma.rentalOrder.findUnique({
    where: { id },
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
            include: {
              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!rental) {
    throw new AppError(404, 'Rental order not found');
  }

  // Authorization check
  if (role === 'CUSTOMER' && rental.customerId !== userId) {
    throw new AppError(
      403,
      'Forbidden: You do not have permission to view this rental order'
    );
  }

  if (role === 'PROVIDER') {
    const hasProviderGear = rental.rentalItems.some(
      (item) => item.gearItem.providerId === userId
    );

    if (!hasProviderGear) {
      throw new AppError(
        403,
        'Forbidden: You do not own any gear listings in this rental order'
      );
    }
  }

  return rental;
};

export const getProviderOrders = async (providerId: string) => {
  return await prisma.rentalOrder.findMany({
    where: {
      rentalItems: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rentalItems: {
        where: {
          gearItem: {
            providerId,
          },
        },
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
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateOrderStatus = async (
  id: string,
  newStatus: 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED',
  providerId: string
) => {
  const rentalOrder = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      rentalItems: {
        include: {
          gearItem: true,
        },
      },
    },
  });

  if (!rentalOrder) {
    throw new AppError(404, 'Rental order not found');
  }

  // Verify provider owns at least one gear item in this order
  const hasProviderGear = rentalOrder.rentalItems.some(
    (item) => item.gearItem.providerId === providerId
  );

  if (!hasProviderGear) {
    throw new AppError(
      403,
      'Forbidden: You do not own any gear listings in this rental order'
    );
  }

  const currentStatus = rentalOrder.status;

  // Validate state machine rules
  let isValidTransition = false;
  if (currentStatus === 'PLACED') {
    isValidTransition = newStatus === 'CONFIRMED' || newStatus === 'CANCELLED';
  } else if (currentStatus === 'CONFIRMED' || currentStatus === 'PAID') {
    isValidTransition = newStatus === 'PICKED_UP';
  } else if (currentStatus === 'PICKED_UP') {
    isValidTransition = newStatus === 'RETURNED';
  }

  if (!isValidTransition) {
    throw new AppError(
      400,
      `Invalid status transition: cannot change status from ${currentStatus} to ${newStatus}`
    );
  }

  // Perform status update and optional stock restoration in a transaction
  return await prisma.$transaction(async (tx) => {
    // If cancelling order or items are returned, increment stock back
    if (newStatus === 'CANCELLED' || newStatus === 'RETURNED') {
      for (const item of rentalOrder.rentalItems) {
        await tx.gearItem.update({
          where: { id: item.gearItemId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return await tx.rentalOrder.update({
      where: { id },
      data: {
        status: newStatus,
      },
      include: {
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
      },
    });
  });
};
