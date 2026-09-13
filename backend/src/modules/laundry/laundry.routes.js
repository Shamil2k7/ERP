import { Router } from "express";
import * as laundryController from "./laundry.controller.js";
import {
  createLaundryValidation,
  createCategoryValidation,
  createServiceValidation,
  createOrderValidation,
  updateOrderStatusValidation,
  updateDeliveryStatusValidation
} from "./laundry.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { requireModuleAccess } from "../../middlewares/moduleAccess.middleware.js";
import { requireRoles } from "../../middlewares/auth.middleware.js";

const router = Router();

// ==========================================
// 1. DASHBOARD & STATS
// ==========================================
router.get(
  "/dashboard/stats",
  requireModuleAccess("LAUNDRY"),
  requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]),
  laundryController.getLaundryStatsController
);

// ==========================================
// 2. SERVICE CATEGORIES
// ==========================================
router.post("/categories", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createCategoryValidation, validateRequest, laundryController.createCategoryController);
router.get("/categories/list", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"]), laundryController.getCategoriesController);
router.get("/categories/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.getCategoryByIdController);
router.put("/categories/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createCategoryValidation, validateRequest, laundryController.updateCategoryController);
router.delete("/categories/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.deleteCategoryController);

// ==========================================
// 3. SERVICES
// ==========================================
router.post("/services", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createServiceValidation, validateRequest, laundryController.createServiceController);
router.get("/services/list", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"]), laundryController.getServicesController);
router.get("/services/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.getServiceByIdController);
router.put("/services/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createServiceValidation, validateRequest, laundryController.updateServiceController);
router.delete("/services/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.deleteServiceController);

// ==========================================
// 4. ORDERS
// ==========================================
router.post("/orders", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER"]), createOrderValidation, validateRequest, laundryController.createOrderController);
router.get("/orders/list", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "PROCESSING_STAFF", "DELIVERY_DRIVER"]), laundryController.getOrdersController);
router.get("/orders/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "PROCESSING_STAFF", "DELIVERY_DRIVER"]), laundryController.getOrderByIdController);
router.put("/orders/:id/status", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER", "CASHIER", "PROCESSING_STAFF"]), updateOrderStatusValidation, validateRequest, laundryController.updateOrderStatusController);

// ==========================================
// 5. GARMENT TRACKING
// ==========================================
router.get("/garments", laundryController.getGarmentsController);
router.post("/garments", laundryController.createGarmentController);
router.get("/garments/scan/:barcode", laundryController.getGarmentByBarcodeController);
router.put("/garments/:id/status", laundryController.updateGarmentStatusController);

// ==========================================
// 6. DELIVERY TRACKING
// ==========================================
router.get("/deliveries", laundryController.getDeliveriesController);
router.put("/orders/:orderId/delivery", updateDeliveryStatusValidation, validateRequest, laundryController.updateDeliveryStatusController);

// ==========================================
// 7. LAUNDRY PROFILES & TENANT CONFIG
// (Placed at bottom so /:id does not catch specific sub-routes)
// ==========================================
router.post("/", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createLaundryValidation, validateRequest, laundryController.createLaundryController);
router.get("/", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.getLaundriesController);
router.get("/profile/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.getLaundryByIdController);
router.put("/profile/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createLaundryValidation, validateRequest, laundryController.updateLaundryController);
router.delete("/profile/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.deleteLaundryController);

// Fallback parameterized profile routes
router.get("/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.getLaundryByIdController);
router.put("/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), createLaundryValidation, validateRequest, laundryController.updateLaundryController);
router.delete("/:id", requireModuleAccess("LAUNDRY"), requireRoles(["ADMIN", "SUPER_ADMIN", "OWNER", "MANAGER"]), laundryController.deleteLaundryController);

export default router;

