import prisma from "../../config/prisma.js";

export const createCategory = async (data) => {
  return await prisma.category.create({
    data,
  });
};

export const getAllCategories = async (companyId) => {
  const where = {};
  if (companyId && companyId !== "ALL" && companyId !== "undefined" && companyId !== "null" && String(companyId).trim() !== "") {
    where.OR = [{ companyId }, { companyId: null }];
  }
  return await prisma.category.findMany({
    where,
    orderBy: {
      name: "asc",
    },
  });
};

export const getCategoryById = async (id) => {
  return await prisma.category.findUnique({
    where: {
      id,
    },
  });
};

export const getCategoryByCode = async (code) => {
  return await prisma.category.findFirst({
    where: {
      code,
    },
  });
};

export const updateCategory = async (id, data) => {
  return await prisma.category.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteCategory = async (id) => {
  return await prisma.category.delete({
    where: {
      id,
    },
  });
};

export const getCategoryProductsCount = async (id) => {
  return await prisma.product.count({
    where: {
      categoryId: id,
    },
  });
};

export const searchCategories = async (search) => {
  return await prisma.category.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};