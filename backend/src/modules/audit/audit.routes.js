import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  createAuditLogManual,
} from "./audit.controller.js";

const router = express.Router();

router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);
router.post("/", createAuditLogManual);

export default router;
