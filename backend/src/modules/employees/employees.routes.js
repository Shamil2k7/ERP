import express from "express";
import { requireRoles } from "../../middlewares/auth.middleware.js";

import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employees.controller.js";

import { validateAddEmployee } from "./employees.validation.js";

const router = express.Router();

router.get("/", requireRoles(["ADMIN", "OWNER", "SUPER_ADMIN", "MANAGER"]), getEmployees);
router.get("/:id", requireRoles(["ADMIN", "OWNER", "SUPER_ADMIN", "MANAGER"]), getEmployee);
router.post("/", requireRoles(["ADMIN", "OWNER", "SUPER_ADMIN", "MANAGER"]), validateAddEmployee, createEmployee);
router.put("/:id", requireRoles(["ADMIN", "OWNER", "SUPER_ADMIN", "MANAGER"]), updateEmployee);
router.delete("/:id", requireRoles(["ADMIN", "OWNER", "SUPER_ADMIN", "MANAGER"]), deleteEmployee);


export default router;