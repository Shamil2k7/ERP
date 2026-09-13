import { body } from "express-validator";

export const createSalonServiceValidation = [
  body("name")
    .notEmpty()
    .withMessage("Service name is required")
    .trim(),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be 0 or greater"),

  body("durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 minute"),
];

export const updateSalonServiceValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Service name cannot be empty")
    .trim(),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be 0 or greater"),

  body("durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 minute"),
];
