import { prisma } from '../../shared/prisma.service.js';
import { AppError } from '../../shared/utils/app-error.js';

export const createCategory = async (data: { name: string; description?: string }) => {
  // 1. Check if category already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: data.name },
  });

  if (existingCategory) {
    throw new AppError(400, 'Category with this name already exists');
  }

  // 2. Create category
  return await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};
