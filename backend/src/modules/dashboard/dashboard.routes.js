import { Router } from "express";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

// Main aggregated overview
router.get("/overview", dashboardController.getDashboardOverview);

// Notices
router.get("/notices", dashboardController.getNotices);
router.post("/notices", dashboardController.createNotice);

// Todos / Tasks
router.get("/todos", dashboardController.getTodos);
router.post("/todos", dashboardController.createTodo);
router.patch("/todos/:id/toggle", dashboardController.toggleTodo);

export default router;
