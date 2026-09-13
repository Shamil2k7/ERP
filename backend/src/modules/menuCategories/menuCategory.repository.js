import prisma from "../../config/prisma.js";

export const createMenuCategory = async (companyId, data) => {
  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  // Validate restaurant belongs to company
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: data.restaurantId, companyId },
  });

  if (!restaurant) {
    const error = new Error("Restaurant outlet not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.menuCategory.create({
    data,
    include: {
      menuItems: true,
    },
  });
};

export const getMenuCategories = async (companyId, restaurantId) => {
  if (!companyId) return [];

  const where = {
    restaurant: {
      companyId,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }

  return await prisma.menuCategory.findMany({
    where,
    include: {
      menuItems: true,
    },
    orderBy: { sortOrder: "asc" },
  });
};

export const getMenuCategoryById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.restaurant = { companyId };
  }

  return await prisma.menuCategory.findFirst({
    where,
    include: {
      menuItems: true,
    },
  });
};

export const updateMenuCategory = async (id, companyId, data) => {
  const existing = await getMenuCategoryById(id, companyId);
  if (!existing) {
    const error = new Error("Menu category not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  if (data.restaurantId && data.restaurantId !== existing.restaurantId) {
    const rest = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, companyId },
    });
    if (!rest) {
      const error = new Error("Target restaurant outlet not found or access denied.");
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.menuCategory.update({
    where: { id },
    data,
  });
};

export const deleteMenuCategory = async (id, companyId) => {
  const existing = await getMenuCategoryById(id, companyId);
  if (!existing) {
    const error = new Error("Menu category not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.menuCategory.delete({
    where: { id },
  });
};
