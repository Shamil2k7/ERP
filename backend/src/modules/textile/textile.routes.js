import { Router } from "express";
import * as textileController from "./textile.controller.js";
import {
  createTextileProductValidation,
  updateTextileProductValidation,
} from "./textile.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { requireTextileModule } from "../../middlewares/textileAccess.middleware.js";

const router = Router();

// Main Textile Dashboard Endpoint
router.get("/dashboard", requireTextileModule("DASHBOARD"), textileController.getTextileDashboard);

// Production Overview & Operations
router.get("/production/overview", requireTextileModule("PRODUCTION"), textileController.getProductionOverview);

// Production Plans Endpoints
router.get("/production/plans", requireTextileModule("PRODUCTION"), textileController.getProductionPlans);
router.post("/production/plans", requireTextileModule("PRODUCTION"), textileController.createProductionPlan);
router.post("/production/plans/:id/approve", requireTextileModule("PRODUCTION"), textileController.approveProductionPlan);

// Production Orders Endpoints
router.get("/production/orders", requireTextileModule("PRODUCTION"), textileController.getProductionBatches);
router.post("/production/orders", requireTextileModule("PRODUCTION"), textileController.createProductionBatch);

// Material Consumption Endpoints
router.get("/production/material-consumption", requireTextileModule("PRODUCTION"), textileController.getMaterialConsumption);
router.post("/production/material-consumption", requireTextileModule("PRODUCTION"), textileController.recordMaterialConsumption);

// Production Stages & Advance Stage Endpoints
router.post("/production/:id/next-stage", requireTextileModule("PRODUCTION"), textileController.advanceProductionStage);

// Production Batches Root Endpoints
router.get("/production", requireTextileModule("PRODUCTION"), textileController.getProductionOverview);
router.post("/production", requireTextileModule("PRODUCTION"), textileController.createProductionBatch);
router.put("/production/:id", requireTextileModule("PRODUCTION"), textileController.updateProductionBatch);
router.delete("/production/:id", requireTextileModule("PRODUCTION"), textileController.deleteProductionBatch);

// Raw Materials Endpoints
router.get("/raw-materials", requireTextileModule("RAW_MATERIALS"), textileController.getRawMaterials);
router.post("/raw-materials", requireTextileModule("RAW_MATERIALS"), textileController.createRawMaterial);
router.put("/raw-materials/:id", requireTextileModule("RAW_MATERIALS"), textileController.updateRawMaterial);
router.delete("/raw-materials/:id", requireTextileModule("RAW_MATERIALS"), textileController.deleteRawMaterial);

// Quality Control Endpoints
router.get("/quality-control", requireTextileModule("QUALITY_CONTROL"), textileController.getQualityInspections);
router.post("/quality-control", requireTextileModule("QUALITY_CONTROL"), textileController.createQualityInspection);
router.delete("/quality-control/:id", requireTextileModule("QUALITY_CONTROL"), textileController.deleteQualityInspection);

// Stock Movements Endpoints
router.get("/stock-movements/summary", requireTextileModule("STOCK_MOVEMENTS"), textileController.getStockMovementsSummary);
router.get("/stock-movements/filters", requireTextileModule("STOCK_MOVEMENTS"), textileController.getStockMovementsFilters);
router.get("/stock-movements", requireTextileModule("STOCK_MOVEMENTS"), textileController.getStockMovements);
router.get("/stock-movements/:id", requireTextileModule("STOCK_MOVEMENTS"), textileController.getStockMovementById);
router.post("/stock-movements", requireTextileModule("STOCK_MOVEMENTS"), textileController.createStockMovement);

// Textile Customers Endpoints
router.get("/customers", requireTextileModule("CUSTOMERS"), textileController.getTextileCustomers);
router.get("/customers/:id", requireTextileModule("CUSTOMERS"), textileController.getTextileCustomerById);
router.post("/customers", requireTextileModule("CUSTOMERS"), textileController.createTextileCustomer);
router.put("/customers/:id", requireTextileModule("CUSTOMERS"), textileController.updateTextileCustomer);
router.delete("/customers/:id", requireTextileModule("CUSTOMERS"), textileController.deleteTextileCustomer);

// Textile Employees & Staff Endpoints (100% Isolated)
router.get("/employees", requireTextileModule("EMPLOYEES"), textileController.getTextileEmployees);
router.get("/employees/:id", requireTextileModule("EMPLOYEES"), textileController.getTextileEmployeeById);
router.post("/employees", requireTextileModule("EMPLOYEES"), textileController.createTextileEmployee);
router.put("/employees/:id", requireTextileModule("EMPLOYEES"), textileController.updateTextileEmployee);
router.delete("/employees/:id", requireTextileModule("EMPLOYEES"), textileController.deleteTextileEmployee);

// Textile Products Endpoints
router.get("/products", requireTextileModule("PRODUCTS"), textileController.getTextileProducts);
router.get("/products/:id", requireTextileModule("PRODUCTS"), textileController.getTextileProductById);
router.post(
  "/products",
  requireTextileModule("PRODUCTS"),
  createTextileProductValidation,
  validateRequest,
  textileController.createTextileProduct
);
router.put(
  "/products/:id",
  requireTextileModule("PRODUCTS"),
  updateTextileProductValidation,
  validateRequest,
  textileController.updateTextileProduct
);
router.delete("/products/:id", requireTextileModule("PRODUCTS"), textileController.deleteTextileProduct);

// Root fallback for textile product collection
router.get("/", requireTextileModule("PRODUCTS"), textileController.getTextileProducts);
router.get("/:id", requireTextileModule("PRODUCTS"), textileController.getTextileProductById);
router.post(
  "/",
  requireTextileModule("PRODUCTS"),
  createTextileProductValidation,
  validateRequest,
  textileController.createTextileProduct
);

export default router;

