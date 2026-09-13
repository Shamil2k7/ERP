import express from "express";
import * as paymentController from "./payments.controller.js";

const router = express.Router();

// ==========================================
// Create Payment
// ==========================================
router.post("/", paymentController.createPayment);

// ==========================================
// Get All Payments
// ==========================================
router.get("/", paymentController.getPayments);

// ==========================================
// Get Customer Payments
// ==========================================
router.get(
  "/customer/:customerId",
  paymentController.getCustomerPayments
);

// ==========================================
// Get Supplier Payments
// ==========================================
router.get(
  "/supplier/:supplierId",
  paymentController.getSupplierPayments
);

// ==========================================
// Get Invoice Payments
// ==========================================
router.get(
  "/invoice/:invoiceId",
  paymentController.getInvoicePayments
);

// ==========================================
// Get Purchase Order Payments
// ==========================================
router.get(
  "/purchase/:purchaseOrderId",
  paymentController.getPurchaseOrderPayments
);

// ==========================================
// Get Payments By Status
// ==========================================
router.get(
  "/status/:status",
  paymentController.getPaymentsByStatus
);

// ==========================================
// Get Payment By ID
// ==========================================
router.get("/:id", paymentController.getPaymentById);

// ==========================================
// Update Payment
// ==========================================
router.put("/:id", paymentController.updatePayment);

// ==========================================
// Update Payment Status
// ==========================================
router.patch(
  "/:id/status",
  paymentController.updatePaymentStatus
);

// ==========================================
// Delete Payment
// ==========================================
router.delete("/:id", paymentController.deletePayment);

export default router;
