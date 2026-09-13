import { Router } from "express";
import * as tableController from "./restaurantTable.controller.js";

const router = Router();

router.post("/", tableController.createTable);
router.get("/", tableController.getTables);
router.get("/:id", tableController.getTableById);
router.put("/:id", tableController.updateTable);
router.patch("/:id/status", tableController.updateTableStatus);
router.delete("/:id", tableController.deleteTable);

export default router;
