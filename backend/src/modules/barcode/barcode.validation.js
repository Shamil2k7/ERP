import { body } from "express-validator";

export const createBarcodeValidation = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("barcode")
    .trim()
    .notEmpty()
    .withMessage("Barcode is required")
    .isLength({ min: 4, max: 100 })
    .withMessage("Barcode must be between 4 and 100 characters"),

  body("type")
    .optional()
    .isIn([
      "CODE128",
      "CODE39",
      "EAN13",
      "EAN8",
      "UPC",
      "ITF14",
    ])
    .withMessage("Invalid barcode type"),
];

export const updateBarcodeValidation = [
  body("productId")
    .optional()
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("barcode")
    .optional()
    .trim()
    .isLength({ min: 4, max: 100 })
    .withMessage("Barcode must be between 4 and 100 characters"),

  body("type")
    .optional()
    .isIn([
      "CODE128",
      "CODE39",
      "EAN13",
      "EAN8",
      "UPC",
      "ITF14",
    ])
    .withMessage("Invalid barcode type"),
];