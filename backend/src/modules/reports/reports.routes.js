import express from "express";
import * as reportsController from "./reports.controller.js";

const router = express.Router();

router.get("/sales", reportsController.getSalesReport);
router.get("/purchases", reportsController.getPurchaseReport);
router.get("/inventory", reportsController.getInventoryReport);
router.get("/filters", reportsController.getReportFilters);
router.get("/dashboard-summary", reportsController.getDashboardSummary);

export default router;
