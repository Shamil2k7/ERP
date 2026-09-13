import { body } from "express-validator";

export const createUnitValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Unit name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Unit name must be between 1 and 100 characters"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Unit code is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Unit code must be between 1 and 20 characters"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be ACTIVE or INACTIVE"),
];

export const updateUnitValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Unit name must be between 1 and 100 characters"),

  body("code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Unit code must be between 1 and 20 characters"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be ACTIVE or INACTIVE"),
];