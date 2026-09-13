import { Router } from "express";
import * as stockController from "./stock.controller.js";
import {
  createStockMovementValidation,
  updateStockMovementValidation,
} from "./stock.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/",
  createStockMovementValidation,
  validateRequest,
  stockController.createStockMovement
);

router.get(
  "/",
  stockController.getAllStockMovements
);

router.get(
  "/product/:productId",
  stockController.getStockMovementsByProduct
);

router.get(
  "/warehouse/:warehouseId",
  stockController.getStockMovementsByWarehouse
);

router.get(
  "/:id",
  stockController.getStockMovementById
);

router.put(
  "/:id",
  updateStockMovementValidation,
  validateRequest,
  stockController.updateStockMovement
);

router.delete(
  "/:id",
  stockController.deleteStockMovement
);

export default router;



//STOCK MOVEMENT ROUTES