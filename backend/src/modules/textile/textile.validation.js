import { body } from "express-validator";

export const createTextileProductValidation = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .trim(),

  body("fabricType")
    .notEmpty()
    .withMessage("Fabric type is required")
    .trim(),

  body("pricePerMeter")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per meter must be 0 or greater"),
];

export const updateTextileProductValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .trim(),

  body("fabricType")
    .optional()
    .trim(),

  body("pricePerMeter")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per meter must be 0 or greater"),
];
