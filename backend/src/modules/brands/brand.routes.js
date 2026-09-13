import { Router } from "express";
import * as brandController from "./brand.controller.js";
import {
  createBrandValidation,
  updateBrandValidation,
} from "./brand.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();
router.post(
  "/",
  createBrandValidation,
  validateRequest,
  brandController.createBrand
);

router.get(
  "/",
  brandController.getAllBrands
);

router.get(
  "/:id",
  brandController.getBrandById
);

router.put(
  "/:id",
  updateBrandValidation,
  validateRequest,
  brandController.updateBrand
);

router.delete(
  "/:id",
  brandController.deleteBrand
);

export default router;