import { body } from "express-validator";

export const createInventoryValidation = [
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

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be 0 or greater"),

  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum stock must be 0 or greater"),

  body("maximumStock")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Maximum stock must be greater than 0"),

  body("reorderLevel")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Reorder level must be 0 or greater"),
];

export const updateInventoryValidation = [
  body("productId")
    .optional()
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("warehouseId")
    .optional()
    .isUUID()
    .withMessage("Invalid Warehouse ID"),

  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be 0 or greater"),

  body("minimumStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum stock must be 0 or greater"),

  body("maximumStock")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Maximum stock must be greater than 0"),

  body("reorderLevel")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Reorder level must be 0 or greater"),
];