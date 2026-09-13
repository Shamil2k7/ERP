import { Router } from "express";
import * as reportController from "./restaurantReport.controller.js";

const router = Router();

router.get("/analytics", reportController.getRestaurantAnalytics);
router.get("/", reportController.getRestaurantAnalytics);

export default router;
