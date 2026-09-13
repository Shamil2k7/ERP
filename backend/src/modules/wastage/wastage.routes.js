import { Router } from "express";
import * as wastageController from "./wastage.controller.js";

const router = Router();

router.post("/", wastageController.createWastage);
router.get("/", wastageController.getWastages);
router.get("/:id", wastageController.getWastageById);
router.delete("/:id", wastageController.deleteWastage);

export default router;
