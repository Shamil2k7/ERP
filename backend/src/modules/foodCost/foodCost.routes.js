import { Router } from "express";
import * as foodCostController from "./foodCost.controller.js";

const router = Router();

router.get("/", foodCostController.getFoodCostingReport);

export default router;
