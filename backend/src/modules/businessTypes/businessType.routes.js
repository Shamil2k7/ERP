import express from "express";

import {
  getBusinessTypes,
  getBusinessType,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
} from "./businessType.controller.js";

const router = express.Router();

router.get("/", getBusinessTypes);
router.get("/:id", getBusinessType);
router.post("/", createBusinessType);
router.put("/:id", updateBusinessType);
router.delete("/:id", deleteBusinessType);

export default router;
