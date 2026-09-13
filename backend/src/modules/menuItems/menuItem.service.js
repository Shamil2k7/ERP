import * as menuItemRepository from "./menuItem.repository.js";

export const createMenuItem = async (companyId, data) => {
  if (!data.name) {
    throw new Error("Item name is required.");
  }
  if (!data.restaurantId) {
    throw new Error("Restaurant ID is required.");
  }
  if (!data.categoryId) {
    throw new Error("Category ID is required.");
  }
  if (data.sellingPrice === undefined || data.sellingPrice === null) {
    throw new Error("Selling price is required.");
  }
  return await menuItemRepository.createMenuItem(companyId, data);
};

export const getMenuItems = async (companyId, restaurantId, categoryId) => {
  return await menuItemRepository.getMenuItems(companyId, restaurantId, categoryId);
};

export const getMenuItemById = async (id, companyId) => {
  const item = await menuItemRepository.getMenuItemById(id, companyId);
  if (!item) {
    const error = new Error("Menu item not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const updateMenuItem = async (id, companyId, data) => {
  return await menuItemRepository.updateMenuItem(id, companyId, data);
};

export const deleteMenuItem = async (id, companyId) => {
  return await menuItemRepository.deleteMenuItem(id, companyId);
};
