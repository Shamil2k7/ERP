import { Router } from "express";
import * as menuItemController from "./menuItem.controller.js";
import upload from "../../middlewares/upload.middleware.js";

const router = Router();

router.post("/", upload.single("image"), menuItemController.createMenuItem);
router.get("/", menuItemController.getMenuItems);
router.get("/:id", menuItemController.getMenuItemById);
router.put("/:id", upload.single("image"), menuItemController.updateMenuItem);
router.delete("/:id", menuItemController.deleteMenuItem);

export default router;
