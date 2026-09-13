import { Router } from "express";
import * as supplierController from "./supplier.controller.js";
import {
  createSupplierValidation,
  updateSupplierValidation,
} from "./supplier.validation.js";

import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/",
  createSupplierValidation,
  validateRequest,
  supplierController.createSupplier
);

router.get("/", supplierController.getAllSuppliers);

router.get(
  "/search",
  supplierController.searchSuppliers
);

router.get(
  "/:id",
  supplierController.getSupplierById
);

router.put(
  "/:id",
  updateSupplierValidation,
  validateRequest,
  supplierController.updateSupplier
);

router.delete(
  "/:id",
  supplierController.deleteSupplier
);

export default router;