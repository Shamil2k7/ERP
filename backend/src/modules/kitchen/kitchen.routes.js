import { Router } from "express";
import * as kitchenController from "./kitchen.controller.js";

const router = Router();

router.get("/orders", kitchenController.getKitchenOrders);
router.get("/orders/:id", kitchenController.getKitchenOrderById);
router.post("/orders/:id/start", kitchenController.startPreparation);
router.post("/orders/:id/ready", kitchenController.markReady);
router.post("/orders/:id/served", kitchenController.markServed);

export default router;
