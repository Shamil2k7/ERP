import express from "express";

import {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "./unit.controller.js";

import {
  createUnitValidation,
  updateUnitValidation,
} from "./unit.validation.js";

import { validationResult } from "express-validator";

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

router.post(
  "/",
  createUnitValidation,
  validate,
  createUnit
);

router.get("/", getAllUnits);

router.get("/:id", getUnitById);

router.put(
  "/:id",
  updateUnitValidation,
  validate,
  updateUnit
);

router.delete("/:id", deleteUnit);

export default router;