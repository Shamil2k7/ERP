import { Router } from "express";
import * as superAdminController from "./superAdmin.controller.js";
import { toggleCompanyStatusValidation } from "./superAdmin.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.get("/stats", superAdminController.getSystemStats);
router.get("/companies", superAdminController.getAllCompanies);
router.patch(
  "/companies/:id/status",
  toggleCompanyStatusValidation,
  validateRequest,
  superAdminController.toggleCompanyStatus
);

export default router;
