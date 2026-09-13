import express from "express";
import * as invoiceController from "./invoices.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Invoice Routes
|--------------------------------------------------------------------------
*/

// Create Invoice
router.post("/", invoiceController.createInvoice);

// Get All Invoices
router.get("/", invoiceController.getInvoices);

// Get Invoice By ID
router.get("/:id", invoiceController.getInvoiceById);

// Update Invoice
router.put("/:id", invoiceController.updateInvoice);

// Delete Invoice
router.delete("/:id", invoiceController.deleteInvoice);

// Update Invoice Status
router.patch("/:id/status", invoiceController.updateStatus);

// Get Customer Invoices
router.get(
  "/customer/:customerId",
  invoiceController.getCustomerInvoices
);

// Get Payment Status
router.get(
  "/payment-status/:status",
  invoiceController.getPaymentStatus
);

export default router;