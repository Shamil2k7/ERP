import { body } from "express-validator";

export const createMedicineValidation = [
  body("productId").notEmpty().isUUID().withMessage("Product ID is required"),
  body("genericName").notEmpty().withMessage("Generic name is required").trim(),
  body("strength").notEmpty().withMessage("Strength is required").trim(),
  body("dosageForm").notEmpty().isIn(["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "OINTMENT", "DROPS", "INHALER", "POWDER", "OTHER"]).withMessage("Invalid dosage form"),
  body("prescriptionRequired").optional().isBoolean().withMessage("prescriptionRequired must be a boolean"),
  body("manufacturer").optional({ checkFalsy: true }).trim(),
];

export const createBatchValidation = [
  body("medicineId").notEmpty().isUUID().withMessage("Medicine ID is required"),
  body("productId").notEmpty().isUUID().withMessage("Product ID is required"),
  body("batchNumber").notEmpty().withMessage("Batch number is required").trim(),
  body("manufacturingDate").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid manufacturing date"),
  body("expiryDate").notEmpty().isISO8601().withMessage("Expiry date is required"),
  body("purchasePrice").notEmpty().isFloat({ min: 0 }).withMessage("Purchase price must be 0 or greater"),
  body("sellingPrice").notEmpty().isFloat({ min: 0 }).withMessage("Selling price must be 0 or greater"),
  body("quantity").notEmpty().isInt({ min: 0 }).withMessage("Quantity must be a non-negative integer"),
  body("supplierId").optional({ checkFalsy: true }).isUUID().withMessage("Invalid supplier ID"),
  body("warehouseId").optional({ checkFalsy: true }).isUUID().withMessage("Invalid warehouse ID"),
];

export const createPrescriptionValidation = [
  body("customerId").notEmpty().isUUID().withMessage("Customer ID is required"),
  body("doctorName").notEmpty().withMessage("Doctor name is required").trim(),
  body("prescriptionNumber").notEmpty().withMessage("Prescription number is required").trim(),
  body("prescriptionDate").optional().isISO8601().withMessage("Invalid prescription date"),
  body("notes").optional({ checkFalsy: true }).trim(),
  body("items").isArray({ min: 1 }).withMessage("Prescription must contain at least 1 medicine item"),
  body("items.*.medicineId").notEmpty().isUUID().withMessage("Medicine ID is required"),
  body("items.*.dosage").notEmpty().withMessage("Dosage is required").trim(),
  body("items.*.frequency").notEmpty().withMessage("Frequency is required").trim(),
  body("items.*.duration").notEmpty().withMessage("Duration is required").trim(),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("items.*.instructions").optional({ checkFalsy: true }).trim(),
];
