import { Router } from "express";
import * as recipeController from "./recipe.controller.js";

const router = Router();

router.get("/", recipeController.getAllRecipes);
router.post("/item/:menuItemId", recipeController.upsertRecipe);
router.get("/item/:menuItemId", recipeController.getRecipeByMenuItem);
router.delete("/:id", recipeController.deleteRecipe);

export default router;
