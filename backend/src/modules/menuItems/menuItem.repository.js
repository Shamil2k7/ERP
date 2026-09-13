import prisma from "../../config/prisma.js";

const menuItemInclude = {
  category: true,
  product: true,
  tax: true,
  recipe: {
    include: {
      ingredients: {
        include: {
          product: true,
        },
      },
    },
  },
  modifierGroups: {
    include: {
      modifierGroup: {
        include: {
          modifiers: true,
        },
      },
    },
  },
};

export const createMenuItem = async (companyId, data) => {
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

  // Validate category belongs to company
  if (data.categoryId) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: data.categoryId, restaurant: { companyId } },
    });
    if (!category) {
      const error = new Error("Menu category not found or access denied.");
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.menuItem.create({
    data,
    include: menuItemInclude,
  });
};

export const getMenuItems = async (companyId, restaurantId, categoryId) => {
  if (!companyId) return [];

  const where = {
    restaurant: {
      companyId,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }
  if (categoryId && categoryId !== "ALL" && categoryId !== "undefined" && categoryId !== "null" && String(categoryId).trim() !== "") {
    where.categoryId = categoryId;
  }

  return await prisma.menuItem.findMany({
    where,
    include: menuItemInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const getMenuItemById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.restaurant = { companyId };
  }

  return await prisma.menuItem.findFirst({
    where,
    include: menuItemInclude,
  });
};

export const updateMenuItem = async (id, companyId, data) => {
  const existing = await getMenuItemById(id, companyId);
  if (!existing) {
    const error = new Error("Menu item not found or access denied.");
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

  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const cat = await prisma.menuCategory.findFirst({
      where: { id: data.categoryId, restaurant: { companyId } },
    });
    if (!cat) {
      const error = new Error("Target category not found or access denied.");
      error.statusCode = 404;
      throw error;
    }
  }

  return await prisma.menuItem.update({
    where: { id },
    data,
    include: menuItemInclude,
  });
};

export const deleteMenuItem = async (id, companyId) => {
  const existing = await getMenuItemById(id, companyId);
  if (!existing) {
    const error = new Error("Menu item not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.menuItem.delete({
    where: { id },
  });
};
