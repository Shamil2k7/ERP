import express from "express";
import { requireRoles } from "../../middlewares/auth.middleware.js";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "./roles.controller.js";

const router = express.Router();

router.get("/", getRoles);
router.get("/:id", getRole);
router.post("/", requireRoles(["ADMIN", "OWNER"]), createRole);
router.put("/:id", requireRoles(["ADMIN", "OWNER"]), updateRole);
router.delete("/:id", requireRoles(["ADMIN", "OWNER"]), deleteRole);

export default router;

