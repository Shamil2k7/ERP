import { z } from "zod";

// ==========================================
// Enums
// ==========================================

const TaxType = z.enum([
  "INCLUSIVE",
  "EXCLUSIVE",
]);

const TaxStatus = z.enum([
  "ACTIVE",
  "INACTIVE",
]);

// ==========================================
// Create Tax Validation
// ==========================================

export const createTaxSchema = z.object({
  name: z
    .string({
      required_error: "Tax name is required",
    })
    .trim()
    .min(2, "Tax name must be at least 2 characters")
    .max(100, "Tax name cannot exceed 100 characters"),

  rate: z
    .number({
      required_error: "Tax rate is required",
    })
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100"),

  type: TaxType,

  status: TaxStatus.default("ACTIVE"),
});

// ==========================================
// Update Tax Validation
// ==========================================

export const updateTaxSchema =
  createTaxSchema.partial();

// ==========================================
// Export
// ==========================================

export default {
  createTaxSchema,
  updateTaxSchema,
};