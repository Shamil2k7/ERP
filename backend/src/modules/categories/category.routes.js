import { Router } from "express";
import * as categoryController from "./category.controller.js";
import {
  createCategoryValidation,
  updateCategoryValidation,
} from "./category.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/",
  createCategoryValidation,
  validateRequest,
  categoryController.createCategory
);

router.get("/", categoryController.getAllCategories);

router.get(
  "/search",
  categoryController.searchCategories
);

router.get(
  "/:id",
  categoryController.getCategoryById
);

router.put(
  "/:id",
  updateCategoryValidation,
  validateRequest,
  categoryController.updateCategory
);

router.delete(
  "/:id",
  categoryController.deleteCategory
);

export default router;