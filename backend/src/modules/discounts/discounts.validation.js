import { z } from "zod";

// ==========================================
// Enums
// ==========================================

const DiscountType = z.enum([
  "PERCENTAGE",
  "FIXED",
]);

const DiscountStatus = z.enum([
  "ACTIVE",
  "INACTIVE",
  "EXPIRED",
]);

// ==========================================
// Create Discount Validation
// ==========================================

export const createDiscountSchema = z.object({
  branchId: z
    .string({
      required_error: "Branch ID is required",
    })
    .uuid("Invalid Branch ID"),

  name: z
    .string({
      required_error: "Discount name is required",
    })
    .trim()
    .min(2, "Discount name must be at least 2 characters")
    .max(100),

  code: z
    .string({
      required_error: "Discount code is required",
    })
    .trim()
    .min(2)
    .max(50),

  type: DiscountType,

  value: z
    .number({
      required_error: "Discount value is required",
    })
    .positive("Discount value must be greater than 0"),

  minimumOrderAmount: z
    .number()
    .min(0)
    .default(0),

  maximumDiscount: z
    .number()
    .positive()
    .optional()
    .nullable(),

  startDate: z
    .string({
      required_error: "Start date is required",
    })
    .datetime("Invalid start date"),

  endDate: z
    .string({
      required_error: "End date is required",
    })
    .datetime("Invalid end date"),

  status: DiscountStatus.default("ACTIVE"),

  description: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

// ==========================================
// Update Discount Validation
// ==========================================

export const updateDiscountSchema =
  createDiscountSchema.partial();

// ==========================================
// Export
// ==========================================

export default {
  createDiscountSchema,
  updateDiscountSchema,
};