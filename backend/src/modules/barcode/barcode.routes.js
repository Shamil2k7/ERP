import { Router } from "express";
import * as barcodeController from "./barcode.controller.js";
import {
  createBarcodeValidation,
  updateBarcodeValidation,
} from "./barcode.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/",
  createBarcodeValidation,
  validateRequest,
  barcodeController.createBarcode
);

router.get(
  "/",
  barcodeController.getAllBarcodes
);

router.get(
  "/image/:barcode",
  barcodeController.generateBarcodeImage
);

router.get(
  "/product/:productId",
  barcodeController.getBarcodeByProductId
);

router.get(
  "/scan/:barcode",
  barcodeController.getProductByBarcode
);

router.get(
  "/:id",
  barcodeController.getBarcodeById
);

router.get(
  "/:id",
  barcodeController.getBarcodeById
);

router.put(
  "/:id",
  updateBarcodeValidation,
  validateRequest,
  barcodeController.updateBarcode
);

router.delete(
  "/:id",
  barcodeController.deleteBarcode
);

export default router;