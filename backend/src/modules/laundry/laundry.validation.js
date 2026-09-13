import { body } from "express-validator";

export const createLaundryValidation = [
  body("name").notEmpty().withMessage("Laundry name is required").trim(),
  body("phone").optional({ checkFalsy: true }).trim().matches(/^[0-9]{10}$/).withMessage("Phone number must contain exactly 10 digits"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("address").optional({ checkFalsy: true }).trim(),
  body("branchId").optional({ checkFalsy: true }).isUUID().withMessage("Invalid branch ID"),
];


export const createCategoryValidation = [
  body("laundryId").notEmpty().isUUID().withMessage("Laundry ID is required"),
  body("name").notEmpty().withMessage("Category name is required").trim(),
  body("description").optional({ checkFalsy: true }).trim(),
  body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be non-negative"),
];

export const createServiceValidation = [
  body("laundryId").notEmpty().isUUID().withMessage("Laundry ID is required"),
  body("categoryId").notEmpty().isUUID().withMessage("Category ID is required"),
  body("name").notEmpty().withMessage("Service name is required").trim(),
  body("description").optional({ checkFalsy: true }).trim(),
  body("price").notEmpty().isFloat({ min: 0 }).withMessage("Price must be 0 or greater"),
  body("estimatedTime").optional().isInt({ min: 1 }).withMessage("Estimated time must be at least 1 minute"),
];

export const createOrderValidation = [
  body("laundryId").notEmpty().isUUID().withMessage("Laundry ID is required"),
  body("branchId").optional({ nullable: true, checkFalsy: true }).isUUID().withMessage("Branch ID must be a valid UUID"),
  body("customerId").optional({ nullable: true, checkFalsy: true }).isUUID().withMessage("Customer ID must be a valid UUID"),
  body("subtotal").notEmpty().isFloat({ min: 0 }).withMessage("Subtotal must be 0 or greater"),
  body("discountAmount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Discount must be 0 or greater"),
  body("taxAmount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Tax must be 0 or greater"),
  body("totalAmount").notEmpty().isFloat({ min: 0 }).withMessage("Total amount must be 0 or greater"),
  body("paidAmount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Paid amount must be 0 or greater"),
  body("specialInstructions").optional({ nullable: true, checkFalsy: true }).trim(),
  body("items").isArray({ min: 1 }).withMessage("Order must contain at least 1 item"),
  body("items.*.serviceId").notEmpty().isUUID().withMessage("Item service ID is required"),
  body("items.*.garmentType").notEmpty().withMessage("Item garment type is required").trim(),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Item quantity must be at least 1"),
  body("items.*.unitPrice").isFloat({ min: 0 }).withMessage("Item unit price must be 0 or greater"),
  body("items.*.discountAmount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("items.*.taxAmount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("items.*.totalAmount").isFloat({ min: 0 }),
  body("items.*.notes").optional({ nullable: true, checkFalsy: true }).trim(),
  
  // Payment info if checking out with payment
  body("payment").optional({ nullable: true }),
  body("payment.method").optional({ nullable: true }).isIn(["CASH", "CARD", "BANK", "WALLET", "OTHER"]),
  body("payment.amount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("payment.referenceNumber").optional({ nullable: true, checkFalsy: true }).trim(),
  
  // Optional home delivery info
  body("delivery").optional({ nullable: true }),
  body("delivery.deliveryAddress").optional({ nullable: true }).notEmpty().withMessage("Delivery address is required"),
  body("delivery.phone").optional({ nullable: true }).notEmpty().withMessage("Delivery phone is required").matches(/^[0-9]{10}$/).withMessage("Phone number must contain exactly 10 digits"),

  body("delivery.deliveryDate").optional({ nullable: true }).isISO8601().withMessage("Invalid delivery date"),
];

export const updateOrderStatusValidation = [
  body("status").notEmpty().isIn(["RECEIVED", "INSPECTING", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED"]).withMessage("Invalid order status"),
  body("notes").optional({ checkFalsy: true }).trim(),
];

export const updateDeliveryStatusValidation = [
  body("deliveryStatus").notEmpty().isIn(["PENDING", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"]).withMessage("Invalid delivery status"),
  body("deliveryNotes").optional({ checkFalsy: true }).trim(),
];
