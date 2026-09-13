import { body } from "express-validator";

export const createBusinessTypeValidation = [
  body("name")
    .notEmpty()
    .withMessage("Business type name is required")
    .trim(),

  body("code")
    .notEmpty()
    .withMessage("Business type code is required")
    .trim()
    .toUpperCase(),

  body("description")
    .optional()
    .trim(),

  body("enabledModules")
    .optional()
    .isArray()
    .withMessage("enabledModules must be an array"),
];

export const updateBusinessTypeValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .trim(),

  body("code")
    .optional()
    .notEmpty()
    .withMessage("Code cannot be empty")
    .trim()
    .toUpperCase(),

  body("description")
    .optional()
    .trim(),

  body("enabledModules")
    .optional()
    .isArray()
    .withMessage("enabledModules must be an array"),
];
