import { body } from "express-validator";

export const createStockMovementValidation = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("warehouseId")
    .notEmpty()
    .withMessage("Warehouse ID is required")
    .isUUID()
    .withMessage("Invalid Warehouse ID"),

  body("type")
    .notEmpty()
    .withMessage("Movement type is required")
    .isIn([
      "PURCHASE",
      "SALE",
      "TRANSFER_IN",
      "TRANSFER_OUT",
      "ADJUSTMENT",
    ])
    .withMessage("Invalid movement type"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  body("referenceNo")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference number cannot exceed 100 characters"),

  body("remarks")
    .optional()
    .trim(),

  body("performedBy")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Performed by cannot exceed 100 characters"),
];

export const updateStockMovementValidation = [
  body("productId")
    .optional()
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("warehouseId")
    .optional()
    .isUUID()
    .withMessage("Invalid Warehouse ID"),

  body("type")
    .optional()
    .isIn([
      "PURCHASE",
      "SALE",
      "TRANSFER_IN",
      "TRANSFER_OUT",
      "ADJUSTMENT",
    ])
    .withMessage("Invalid movement type"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  body("referenceNo")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Reference number cannot exceed 100 characters"),

  body("remarks")
    .optional()
    .trim(),

  body("performedBy")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Performed by cannot exceed 100 characters"),
];