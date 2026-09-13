import express from "express";
import * as salesController from "./sales.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Sales Order Routes
|--------------------------------------------------------------------------
*/

// Create Sales Order
router.post("/", salesController.createSalesOrder);

// Get All Sales Orders
router.get("/", salesController.getSalesOrders);

// Get Sales Order By ID
router.get("/:id", salesController.getSalesOrderById);

// Update Sales Order
router.put("/:id", salesController.updateSalesOrder);

// Delete Sales Order
router.delete("/:id", salesController.deleteSalesOrder);

// Update Sales Order Status
router.patch("/:id/status", salesController.updateOrderStatus);

// Get Orders By Customer
router.get("/customer/:customerId", salesController.getCustomerOrders);

// Get Orders By Branch
router.get("/branch/:branchId", salesController.getBranchOrders);

// Get Orders By Status
router.get("/status/:status", salesController.getStatusOrders);

export default router;