import { z } from "zod";

// ==========================================
// Enums
// ==========================================

const ReturnType = z.enum([
  "SALES_RETURN",
  "PURCHASE_RETURN",
]);

// ==========================================
// Create Return Validation
// ==========================================

export const createReturnSchema = z.object({
  branchId: z
    .string({
      required_error: "Branch ID is required",
    })
    .uuid("Invalid Branch ID"),

  type: ReturnType,

  referenceSalesOrderId: z
    .string()
    .uuid("Invalid Sales Order ID")
    .optional()
    .nullable(),

  referencePurchaseOrderId: z
    .string()
    .uuid("Invalid Purchase Order ID")
    .optional()
    .nullable(),

  returnNumber: z
    .string({
      required_error: "Return Number is required",
    })
    .min(1, "Return Number cannot be empty"),

  returnDate: z
    .string({
      required_error: "Return Date is required",
    })
    .datetime("Invalid Return Date"),

  totalAmount: z
    .number({
      required_error: "Total Amount is required",
    })
    .nonnegative("Total Amount cannot be negative"),

  taxAmount: z
    .number()
    .nonnegative("Tax Amount cannot be negative")
    .default(0),

  netAmount: z
    .number({
      required_error: "Net Amount is required",
    })
    .nonnegative("Net Amount cannot be negative"),
});

// ==========================================
// Update Return Validation
// ==========================================

export const updateReturnSchema =
  createReturnSchema.partial();

// ==========================================
// Export
// ==========================================

export default {
  createReturnSchema,
  updateReturnSchema,
};