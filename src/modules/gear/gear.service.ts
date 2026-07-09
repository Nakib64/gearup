import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

export const getAllGears = async (query: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  page?: number;
  providerId?: string; // Optional filter for provider's own listings
}) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    limit = 10,
    page = 1,
    providerId,
  } = query;

  const where: any = {};

  // For public endpoints, we only query gear items that are in stock.
  // For provider/admin queries, we might not restrict to stock > 0, but by default (public) we do.
  // If providerId is passed, it's specific to that provider, so we don't force stock > 0.
  if (providerId) {
    where.providerId = providerId;
  } else {
    where.stock = {
      gt: 0,
    };
  }

  if (brand) {
    where.brand = {
      equals: brand,
      mode: 'insensitive',
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerDay = {};
    if (minPrice !== undefined) {
      where.pricePerDay.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.pricePerDay.lte = maxPrice;
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    const foundCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { id: category },
          { name: { equals: category, mode: 'insensitive' } },
        ],
      },
    });

    if (foundCategory) {
      where.categoryId = foundCategory.id;
    } else {
      // If the category filter is specified but doesn't exist, we return no results
      where.categoryId = '00000000-0000-0000-0000-000000000000';
    }
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, total] = await Promise.all([
    prisma.gearItem.findMany({
      where,
      skip,
      take,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
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
    }),
    prisma.gearItem.count({ where }),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data,
  };
};

export const getGearById = async (id: string) => {
  const gearItem = await prisma.gearItem.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviews: {
        include: {
          customer: {
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
      },
    },
  });

  if (!gearItem) {
    throw new AppError(404, 'Gear item not found');
  }

  // Count average rating and total reviews
  const reviewAggregation = await prisma.review.aggregate({
    where: { gearItemId: id },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return {
    ...gearItem,
    averageRating: reviewAggregation._avg.rating ? parseFloat(reviewAggregation._avg.rating.toFixed(1)) : 0,
    reviewCount: reviewAggregation._count.rating || 0,
  };
};

export const createGear = async (
  data: {
    title: string;
    description: string;
    pricePerDay: number;
    brand: string;
    stock: number;
    categoryId: string;
  },
  providerId: string
) => {
  // Check if category exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!categoryExists) {
    throw new AppError(404, 'Category not found');
  }

  return await prisma.gearItem.create({
    data: {
      ...data,
      providerId,
    },
    include: {
      category: true,
    },
  });
};

export const updateGear = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    pricePerDay?: number;
    brand?: string;
    stock?: number;
    categoryId?: string;
  },
  providerId: string
) => {
  const gearItem = await prisma.gearItem.findUnique({
    where: { id },
  });

  if (!gearItem) {
    throw new AppError(404, 'Gear item not found');
  }

  if (gearItem.providerId !== providerId) {
    throw new AppError(403, 'Forbidden: You do not own this listing');
  }

  if (data.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!categoryExists) {
      throw new AppError(404, 'Category not found');
    }
  }

  return await prisma.gearItem.update({
    where: { id },
    data,
    include: {
      category: true,
    },
  });
};

export const deleteGear = async (id: string, providerId: string) => {
  const gearItem = await prisma.gearItem.findUnique({
    where: { id },
  });

  if (!gearItem) {
    throw new AppError(404, 'Gear item not found');
  }

  if (gearItem.providerId !== providerId) {
    throw new AppError(403, 'Forbidden: You do not own this listing');
  }

  // Check if the gear item is linked to any rental items to prevent FK violation and give clear error
  const rentedCount = await prisma.rentalItem.count({
    where: { gearItemId: id },
  });

  if (rentedCount > 0) {
    throw new AppError(
      400,
      'Cannot delete gear item as it is linked to rental orders'
    );
  }

  // Check if there are reviews linked to this gear item
  const reviewCount = await prisma.review.count({
    where: { gearItemId: id },
  });

  if (reviewCount > 0) {
    throw new AppError(
      400,
      'Cannot delete gear item as it has reviews'
    );
  }

  return await prisma.gearItem.delete({
    where: { id },
  });
};
