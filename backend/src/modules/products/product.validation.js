import { body } from "express-validator";

const isUuidOrString = (val) => {
  if (!val || val === "" || val === "null" || val === "undefined") return true;
  return true;
};

const optFalsy = { checkFalsy: true, nullable: true };

export const createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Ingredient / Product name is required")
    .isLength({ min: 1, max: 150 })
    .withMessage("Product name must be between 1 and 150 characters"),

  body("sku")
    .optional(optFalsy)
    .trim(),

  body("barcode")
    .optional(optFalsy)
    .trim(),

  body("categoryId")
    .optional(optFalsy)
    .custom(isUuidOrString),

  body("subcategory")
    .optional(optFalsy)
    .trim(),

  body("brandId")
    .optional(optFalsy)
    .custom(isUuidOrString),

  body("costPrice")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Cost price must be greater than or equal to 0")
    .toFloat(),

  body("sellingPrice")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Selling price must be greater than or equal to 0")
    .toFloat(),

  body("wholesalePrice")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Wholesale price must be a valid number")
    .toFloat(),

  body("retailPrice")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Retail price must be a valid number")
    .toFloat(),

  body("discountType")
    .optional(optFalsy)
    .isIn(["PERCENT", "FIXED"])
    .withMessage("Discount type must be PERCENT or FIXED"),

  body("discountValue")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Discount value must be greater than or equal to 0")
    .toFloat(),

  body("taxRate")
    .optional(optFalsy)
    .isFloat({ min: 0 })
    .withMessage("Tax rate must be a valid number")
    .toFloat(),

  body("unitId")
    .optional(optFalsy)
    .custom(isUuidOrString),

  body("image")
    .optional(optFalsy)
    .custom((value) => {
      if (!value || value === "" || value === "null") return true;
      return true;
    }),

  body("description")
    .optional(optFalsy)
    .trim(),

  body("status")
    .optional(optFalsy)
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be ACTIVE or INACTIVE"),

  // Textile Fabric Specifications
  body("fabricComposition").optional(optFalsy).trim(),
  body("gsm").optional(optFalsy).isFloat({ min: 0 }).withMessage("GSM must be a valid number").toFloat(),
  body("rollWidth").optional(optFalsy).isFloat({ min: 0 }).withMessage("Roll width must be a valid number").toFloat(),
  body("widthUnit").optional(optFalsy).trim(),
  body("color").optional(optFalsy).trim(),
  body("colorCode").optional(optFalsy).trim(),
  body("pattern").optional(optFalsy).trim(),
  body("weaveType").optional(optFalsy).trim(),
  body("textureFinish").optional(optFalsy).trim(),

  // Inventory Details
  body("stockUnit").optional(optFalsy).trim(),
  body("initialStock").optional(optFalsy).isFloat({ min: 0 }).withMessage("Initial stock must be a valid number").toFloat(),
  body("openingStockDate").optional(optFalsy),
  body("reorderLevel").optional(optFalsy).isFloat({ min: 0 }).withMessage("Reorder level must be a valid number").toFloat(),
  body("minimumStock").optional(optFalsy).isFloat({ min: 0 }).withMessage("Minimum stock must be a valid number").toFloat(),
  body("maximumStock").optional(optFalsy).isFloat({ min: 0 }).withMessage("Maximum stock must be a valid number").toFloat(),
  body("warehouseId").optional(optFalsy).custom(isUuidOrString),
  body("warehouseLocation").optional(optFalsy).trim(),
  body("rackLocation").optional(optFalsy).trim(),
  body("numberOfRolls").optional(optFalsy).isFloat({ min: 0 }).withMessage("Number of rolls must be a valid number").toFloat(),

  // Supplier Details
  body("supplierId")
    .optional(optFalsy)
    .custom(isUuidOrString),
  body("supplierProductCode").optional(optFalsy).trim(),
  body("leadTime").optional(optFalsy).isFloat({ min: 0 }).withMessage("Lead time must be a valid number").toFloat(),
  body("hasVariants").optional(optFalsy),
  body("variants").optional(optFalsy),

  // Restaurant Raw Material Details
  body("purchaseUnit").optional(optFalsy).trim(),
  body("conversionFactor").optional(optFalsy).isFloat({ min: 0 }).withMessage("Conversion factor must be a valid number").toFloat(),
  body("reorderQuantity").optional(optFalsy).isFloat({ min: 0 }).withMessage("Reorder quantity must be a valid number").toFloat(),
  body("averageCost").optional(optFalsy).isFloat({ min: 0 }).withMessage("Average cost must be a valid number").toFloat(),
  body("lastPurchaseCost").optional(optFalsy).isFloat({ min: 0 }).withMessage("Last purchase cost must be a valid number").toFloat(),
  body("supplierReference").optional(optFalsy).trim(),
  body("restaurantOutletId").optional(optFalsy).trim(),
  body("defaultStorageLocation").optional(optFalsy).trim(),
  body("storageType").optional(optFalsy).trim(),
  body("isPerishable").optional(optFalsy),
  body("isExpiryTracking").optional(optFalsy),
  body("isBatchTracking").optional(optFalsy),
];

export const updateProductValidation = [
  body("name")
    .optional(optFalsy)
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Product name must be between 1 and 150 characters"),

  body("sku")
    .optional(optFalsy)
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("SKU must be between 1 and 50 characters"),

  body("barcode").optional(optFalsy).trim(),
  body("categoryId").optional(optFalsy),
  body("subcategory").optional(optFalsy).trim(),
  body("brandId").optional(optFalsy),
  body("costPrice").optional(optFalsy).isFloat({ min: 0 }).withMessage("Cost price must be a valid number").toFloat(),
  body("sellingPrice").optional(optFalsy).isFloat({ min: 0 }).withMessage("Selling price must be a valid number").toFloat(),
  body("wholesalePrice").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("retailPrice").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("discountType").optional(optFalsy).isIn(["PERCENT", "FIXED"]),
  body("discountValue").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("taxRate").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("unitId").optional(optFalsy),
  body("image").optional(optFalsy),
  body("description").optional(optFalsy).trim(),
  body("status").optional(optFalsy).isIn(["ACTIVE", "INACTIVE"]),

  // Textile Fabric Specifications
  body("fabricComposition").optional(optFalsy).trim(),
  body("gsm").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("rollWidth").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("widthUnit").optional(optFalsy).trim(),
  body("color").optional(optFalsy).trim(),
  body("colorCode").optional(optFalsy).trim(),
  body("pattern").optional(optFalsy).trim(),
  body("weaveType").optional(optFalsy).trim(),
  body("textureFinish").optional(optFalsy).trim(),

  // Inventory Details
  body("stockUnit").optional(optFalsy).trim(),
  body("initialStock").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("openingStockDate").optional(optFalsy),
  body("reorderLevel").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("minimumStock").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("maximumStock").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("warehouseId").optional(optFalsy).custom(isUuidOrString),
  body("warehouseLocation").optional(optFalsy).trim(),
  body("rackLocation").optional(optFalsy).trim(),
  body("numberOfRolls").optional(optFalsy).isFloat({ min: 0 }).toFloat(),

  // Supplier Details
  body("supplierId").optional(optFalsy),
  body("supplierProductCode").optional(optFalsy).trim(),
  body("leadTime").optional(optFalsy).isFloat({ min: 0 }).toFloat(),
  body("hasVariants").optional(optFalsy),
  body("variants").optional(optFalsy),
];