import { Router } from "express";
import * as areaController from "./restaurantArea.controller.js";

const router = Router();

router.post("/", areaController.createArea);
router.get("/", areaController.getAreasByRestaurant);
router.get("/:id", areaController.getAreaById);
router.put("/:id", areaController.updateArea);
router.delete("/:id", areaController.deleteArea);

export default router;
