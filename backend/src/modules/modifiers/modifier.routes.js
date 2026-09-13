import { Router } from "express";
import * as modifierController from "./modifier.controller.js";

const router = Router();

router.post("/", modifierController.createModifierGroup);
router.get("/", modifierController.getModifierGroups);
router.get("/:id", modifierController.getModifierGroupById);
router.put("/:id", modifierController.updateModifierGroup);
router.post("/link", modifierController.linkMenuItem);
router.post("/unlink", modifierController.unlinkMenuItem);
router.delete("/:id", modifierController.deleteModifierGroup);

export default router;
