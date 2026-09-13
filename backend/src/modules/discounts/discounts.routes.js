import express from "express";
import * as controller from "./discounts.controller.js";

const router = express.Router();

// ==========================================
// Create Discount
// ==========================================
router.post("/", controller.createDiscount);

// ==========================================
// Get Discounts
// ==========================================
router.get("/", controller.getDiscounts);

// ==========================================
// Get Active Discounts
// ==========================================
router.get("/active", controller.getActiveDiscounts);

// ==========================================
// Get Inactive Discounts
// ==========================================
router.get("/inactive", controller.getInactiveDiscounts);

// ==========================================
// Get Expired Discounts
// ==========================================
router.get("/expired", controller.getExpiredDiscounts);

// ==========================================
// Get Percentage Discounts
// ==========================================
router.get("/percentage", controller.getPercentageDiscounts);

// ==========================================
// Get Fixed Discounts
// ==========================================
router.get("/fixed", controller.getFixedDiscounts);

// ==========================================
// Get Discount Count
// ==========================================
router.get("/count", controller.getDiscountCount);

// ==========================================
// Get Discount By ID
// ==========================================
router.get("/:id", controller.getDiscount);

// ==========================================
// Update Discount
// ==========================================
router.put("/:id", controller.updateDiscount);

// ==========================================
// Delete Discount
// ==========================================
router.delete("/:id", controller.deleteDiscount);

export default router;