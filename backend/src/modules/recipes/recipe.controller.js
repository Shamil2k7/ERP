import * as recipeService from "./recipe.service.js";

export const upsertRecipe = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const recipe = await recipeService.upsertRecipe(companyId, req.params.menuItemId, req.body);
    return res.status(200).json({ success: true, message: "Recipe saved successfully", data: recipe });
  } catch (error) { next(error); }
};

export const getRecipeByMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const recipe = await recipeService.getRecipeByMenuItem(companyId, req.params.menuItemId);
    return res.status(200).json({ success: true, data: recipe });
  } catch (error) { next(error); }
};

export const getAllRecipes = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId } = req.query;
    const recipes = await recipeService.getAllRecipes(companyId, restaurantId);
    return res.status(200).json({ success: true, data: recipes });
  } catch (error) { next(error); }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await recipeService.deleteRecipe(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) { next(error); }
};
