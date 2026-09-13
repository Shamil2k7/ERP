import { Router } from "express";
import * as menuCategoryController from "./menuCategory.controller.js";

const router = Router();

router.post("/", menuCategoryController.createMenuCategory);
router.get("/", menuCategoryController.getMenuCategories);
router.get("/:id", menuCategoryController.getMenuCategoryById);
router.put("/:id", menuCategoryController.updateMenuCategory);
router.delete("/:id", menuCategoryController.deleteMenuCategory);

export default router;
