import { Router } from "express";
import * as productController from "./product.controller.js";
import {
  createProductValidation,
  updateProductValidation,
} from "./product.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  (req, res, next) => {
    if (req.file) {
      req.body.image = "/uploads/" + req.file.filename;
    }
    if (typeof req.body.variants === "string") {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {}
    }
    next();
  },
  createProductValidation,
  validateRequest,
  productController.createProduct
);

router.get("/", productController.getAllProducts);

router.get(
  "/search",
  productController.searchProducts
);

router.get(
  "/:id",
  productController.getProductById
);

router.put(
  "/:id",
  upload.single("image"),
  (req, res, next) => {
    if (req.file) {
      req.body.image = "/uploads/" + req.file.filename;
    }
    if (typeof req.body.variants === "string") {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (e) {}
    }
    next();
  },
  updateProductValidation,
  validateRequest,
  productController.updateProduct
);

router.delete(
  "/:id",
  productController.deleteProduct
);

export default router;