import { Router } from "express";
import * as salonController from "./salon.controller.js";
import {
  createSalonServiceValidation,
  updateSalonServiceValidation,
} from "./salon.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.get("/", salonController.getSalonServices);
router.get("/:id", salonController.getSalonServiceById);
router.post(
  "/",
  createSalonServiceValidation,
  validateRequest,
  salonController.createSalonService
);
router.put(
  "/:id",
  updateSalonServiceValidation,
  validateRequest,
  salonController.updateSalonService
);
router.delete("/:id", salonController.deleteSalonService);

export default router;
