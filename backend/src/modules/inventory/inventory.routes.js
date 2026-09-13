import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";
import {
  createInventoryValidation,
  updateInventoryValidation,
} from "./inventory.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/",
  createInventoryValidation,
  validateRequest,
  inventoryController.createInventory
);

router.get(
  "/",
  inventoryController.getAllInventories
);

router.get(
  "/product/:productId",
  inventoryController.getInventoryByProduct
);

router.get(
  "/warehouse/:warehouseId",
  inventoryController.getInventoryByWarehouse
);

router.get(
  "/:id",
  inventoryController.getInventoryById
);

router.put(
  "/:id",
  updateInventoryValidation,
  validateRequest,
  inventoryController.updateInventory
);

router.delete(
  "/:id",
  inventoryController.deleteInventory
);

export default router;