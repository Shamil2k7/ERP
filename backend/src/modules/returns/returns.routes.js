import express from "express";
import * as controller from "./returns.controller.js";

const router = express.Router();

router.post("/", controller.createReturn);
router.get("/", controller.getReturns);
router.get("/sales", controller.getSalesReturns);
router.get("/purchase", controller.getPurchaseReturns);
router.get("/count", controller.getReturnCount);
router.get("/:id", controller.getReturnById);
router.put("/:id", controller.updateReturn);
router.delete("/:id", controller.deleteReturn);

export default router;