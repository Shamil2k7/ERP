import { Router } from "express";
import * as orderController from "./restaurantOrder.controller.js";

const router = Router();

router.post("/", orderController.createOrder);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrder);

router.get("/:id/check-stock", orderController.checkStockAvailability);
router.post("/:id/confirm", orderController.confirmOrderAndSendKOT);
router.post("/:id/send-kot", orderController.confirmOrderAndSendKOT);
router.post("/:id/complete", orderController.completeOrderAndPay);
router.post("/:id/cancel", orderController.cancelOrder);

export default router;
