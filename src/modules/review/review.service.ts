import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

export const createReview = async (
  customerId: string,
  data: {
    rentalOrderId: string;
    gearItemId: string;
    rating: number;
    comment?: string;
  }
) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: data.rentalOrderId },
    include: { rentalItems: true },
  });

  if (!order) {
    throw new AppError(404, 'Rental order not found');
  }

  if (order.customerId !== customerId) {
    throw new AppError(403, 'Forbidden: You do not own this rental order');
  }

  if (order.status !== 'RETURNED') {
    throw new AppError(400, 'Reviews can only be submitted after the gear is returned');
  }

  // Ensure the gear item was part of the rental order
  const hasItem = order.rentalItems.some((item) => item.gearItemId === data.gearItemId);
  if (!hasItem) {
    throw new AppError(400, 'This gear item is not part of the rental order');
  }

  // Check unique review constraint
  const existingReview = await prisma.review.findUnique({
    where: {
      customerId_rentalOrderId_gearItemId: {
        customerId,
        rentalOrderId: data.rentalOrderId,
        gearItemId: data.gearItemId,
      },
    },
  });

  if (existingReview) {
    throw new AppError(
      400,
      'You have already reviewed this gear item for this rental order'
    );
  }

  return await prisma.review.create({
    data: {
      customerId,
      rentalOrderId: data.rentalOrderId,
      gearItemId: data.gearItemId,
      rating: data.rating,
      comment: data.comment,
    },
  });
};
