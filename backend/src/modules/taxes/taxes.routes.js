import express from "express";
import * as controller from "./taxes.controller.js";

const router = express.Router();

// ==========================================
// Create Tax
// ==========================================
router.post("/", controller.createTax);

// ==========================================
// Get All Taxes
// ==========================================
router.get("/", controller.getTaxes);

// ==========================================
// Get Active Taxes
// ==========================================
router.get("/active", controller.getActiveTaxes);

// ==========================================
// Get Inactive Taxes
// ==========================================
router.get("/inactive", controller.getInactiveTaxes);

// ==========================================
// Get Inclusive Taxes
// ==========================================
router.get("/inclusive", controller.getInclusiveTaxes);

// ==========================================
// Get Exclusive Taxes
// ==========================================
router.get("/exclusive", controller.getExclusiveTaxes);

// ==========================================
// Get Total Tax Count
// ==========================================
router.get("/count", controller.getTaxCount);

// ==========================================
// Get Tax By ID
// ==========================================
router.get("/:id", controller.getTax);

// ==========================================
// Update Tax
// ==========================================
router.put("/:id", controller.updateTax);

// ==========================================
// Delete Tax
// ==========================================
router.delete("/:id", controller.deleteTax);

export default router;