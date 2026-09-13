import express from "express";
import { requireRoles } from "../../middlewares/auth.middleware.js";

import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./department.controller.js";

import { validateDepartment } from "./department.validation.js";

const router = express.Router();

router.get("/", getDepartments);
router.get("/:id", getDepartment);
router.post("/", requireRoles(["ADMIN", "OWNER"]), validateDepartment, createDepartment);
router.put("/:id", requireRoles(["ADMIN", "OWNER"]), validateDepartment, updateDepartment);
router.delete("/:id", requireRoles(["ADMIN", "OWNER"]), deleteDepartment);

export default router;

