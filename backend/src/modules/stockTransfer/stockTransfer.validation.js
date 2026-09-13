import { body } from "express-validator";

export const createStockTransferValidation = [
  body("transferNo")
    .trim()
    .notEmpty()
    .withMessage("Transfer number is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Transfer number must be between 2 and 50 characters"),

  body("fromWarehouseId")
    .notEmpty()
    .withMessage("Source warehouse is required")
    .isUUID()
    .withMessage("Invalid source warehouse ID"),

  body("toWarehouseId")
    .notEmpty()
    .withMessage("Destination warehouse is required")
    .isUUID()
    .withMessage("Invalid destination warehouse ID"),

  body("transferDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid transfer date"),

  body("status")
    .optional()
    .isIn([
      "PENDING",
      "APPROVED",
      "COMPLETED",
      "CANCELLED",
    ])
    .withMessage("Invalid transfer status"),

  body("reason")
    .optional()
    .trim(),

  body("remarks")
    .optional()
    .trim(),

  body("approvedBy")
    .optional()
    .trim(),

  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one transfer item is required"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),
];

export const updateStockTransferValidation = [
  body("transferNo")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Transfer number must be between 2 and 50 characters"),

  body("fromWarehouseId")
    .optional()
    .isUUID()
    .withMessage("Invalid source warehouse ID"),

  body("toWarehouseId")
    .optional()
    .isUUID()
    .withMessage("Invalid destination warehouse ID"),

  body("transferDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid transfer date"),

  body("status")
    .optional()
    .isIn([
      "PENDING",
      "APPROVED",
      "COMPLETED",
      "CANCELLED",
    ])
    .withMessage("Invalid transfer status"),

  body("reason")
    .optional()
    .trim(),

  body("remarks")
    .optional()
    .trim(),

  body("approvedBy")
    .optional()
    .trim(),
];