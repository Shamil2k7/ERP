import * as ingredientRepo from "./restaurantIngredient.repository.js";

export const createIngredient = async (companyId, data) => {
  return await ingredientRepo.createIngredient({ ...data, companyId });
};

export const getAllIngredients = async (companyId, params) => {
  return await ingredientRepo.getAllIngredients({ ...params, companyId });
};

export const getIngredientById = async (id, companyId) => {
  const item = await ingredientRepo.getIngredientById(id, companyId);
  if (!item) {
    const error = new Error("Ingredient not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const updateIngredient = async (id, companyId, data) => {
  return await ingredientRepo.updateIngredient(id, companyId, data);
};

export const addIngredientStock = async (id, companyId, data) => {
  return await ingredientRepo.addIngredientStock(id, companyId, data);
};

export const deleteIngredient = async (id, companyId) => {
  return await ingredientRepo.deleteIngredient(id, companyId);
};

