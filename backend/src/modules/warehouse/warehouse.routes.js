import { Router } from "express";
import { requireRoles } from "../../middlewares/auth.middleware.js";
import * as warehouseController from "./warehouse.controller.js";
import {
  createWarehouseValidation,
  updateWarehouseValidation,
} from "./warehouse.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();
router.post(
  "/",
  requireRoles(["ADMIN", "OWNER", "STORE_MANAGER", "STORE MANAGER", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "MANAGER"]),
  createWarehouseValidation,
  validateRequest,
  warehouseController.createWarehouse
);
router.get(
  "/",
  warehouseController.getAllWarehouses
);

router.get(
  "/search",
  warehouseController.searchWarehouses
);

router.get(
  "/:id",
  warehouseController.getWarehouseById
);

router.put(
  "/:id",
  requireRoles(["ADMIN", "OWNER", "STORE_MANAGER", "STORE MANAGER", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "MANAGER"]),
  updateWarehouseValidation,
  validateRequest,
  warehouseController.updateWarehouse
);
router.delete(
  "/:id",
  requireRoles(["ADMIN", "OWNER", "STORE_MANAGER", "STORE MANAGER", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "MANAGER"]),
  warehouseController.deleteWarehouse
);

export default router;