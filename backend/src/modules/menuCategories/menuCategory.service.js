import * as menuCategoryRepository from "./menuCategory.repository.js";

export const createMenuCategory = async (companyId, data) => {
  if (!data.name) {
    throw new Error("Category name is required.");
  }
  if (!data.restaurantId) {
    throw new Error("Restaurant ID is required.");
  }
  return await menuCategoryRepository.createMenuCategory(companyId, data);
};

export const getMenuCategories = async (companyId, restaurantId) => {
  return await menuCategoryRepository.getMenuCategories(companyId, restaurantId);
};

export const getMenuCategoryById = async (id, companyId) => {
  const category = await menuCategoryRepository.getMenuCategoryById(id, companyId);
  if (!category) {
    const error = new Error("Menu Category not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return category;
};

export const updateMenuCategory = async (id, companyId, data) => {
  return await menuCategoryRepository.updateMenuCategory(id, companyId, data);
};

export const deleteMenuCategory = async (id, companyId) => {
  return await menuCategoryRepository.deleteMenuCategory(id, companyId);
};
