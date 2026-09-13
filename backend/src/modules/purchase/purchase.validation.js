import { body } from "express-validator";

export const createPurchaseValidation = [
  body("purchaseNo")
    .trim()
    .notEmpty()
    .withMessage("Purchase number is required"),

  body("supplierId")
    .notEmpty()
    .withMessage("Supplier ID is required")
    .isUUID()
    .withMessage("Invalid Supplier ID"),

  body("warehouseId")
    .notEmpty()
    .withMessage("Warehouse ID is required")
    .isUUID()
    .withMessage("Invalid Warehouse ID"),

  body("purchaseDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid purchase date"),

  body("totalAmount")
    .notEmpty()
    .withMessage("Total amount is required")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be greater than or equal to 0"),

  body("status")
    .optional()
    .isIn(["PENDING", "RECEIVED", "PARTIAL", "CANCELLED"])
    .withMessage("Invalid purchase status"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string"),

  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one purchase item is required"),

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

  body("items.*.unitPrice")
    .notEmpty()
    .withMessage("Unit price is required")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be greater than or equal to 0"),

  body("items.*.totalPrice")
    .notEmpty()
    .withMessage("Total price is required")
    .isFloat({ min: 0 })
    .withMessage("Total price must be greater than or equal to 0"),
];

export const updatePurchaseValidation = [
  body("supplierId")
    .optional()
    .isUUID()
    .withMessage("Invalid Supplier ID"),

  body("warehouseId")
    .optional()
    .isUUID()
    .withMessage("Invalid Warehouse ID"),

  body("purchaseDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid purchase date"),

  body("totalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total amount must be greater than or equal to 0"),

  body("status")
    .optional()
    .isIn(["PENDING", "RECEIVED", "PARTIAL", "CANCELLED"])
    .withMessage("Invalid purchase status"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string"),

  body("items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),

  body("items.*.productId")
    .optional()
    .isUUID()
    .withMessage("Invalid Product ID"),

  body("items.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),

  body("items.*.unitPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Unit price must be greater than or equal to 0"),

  body("items.*.totalPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total price must be greater than or equal to 0"),
];