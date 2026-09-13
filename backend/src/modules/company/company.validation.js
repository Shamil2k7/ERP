import { body } from "express-validator";

export const createCompanyValidation = [
  body("name")
    .notEmpty()
    .withMessage("Company name is required")
    .trim(),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim(),

  body("address")
    .optional()
    .trim(),

  body("currency")
    .optional()
    .trim(),
];

export const updateCompanyValidation = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Company name cannot be empty")
    .trim(),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .trim(),

  body("address")
    .optional()
    .trim(),

  body("currency")
    .optional()
    .trim(),
];
