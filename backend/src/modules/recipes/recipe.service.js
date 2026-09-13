import * as recipeRepository from "./recipe.repository.js";

export const upsertRecipe = async (companyId, menuItemId, data) => {
  if (!menuItemId) {
    throw new Error("Menu item ID is required.");
  }
  return await recipeRepository.upsertRecipe(companyId, menuItemId, data);
};

export const getRecipeByMenuItem = async (companyId, menuItemId) => {
  const recipe = await recipeRepository.getRecipeByMenuItem(companyId, menuItemId);
  return recipe;
};

export const getAllRecipes = async (companyId, restaurantId) => {
  return await recipeRepository.getAllRecipes(companyId, restaurantId);
};

export const deleteRecipe = async (id, companyId) => {
  return await recipeRepository.deleteRecipe(id, companyId);
};
