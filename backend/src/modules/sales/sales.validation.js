import { z } from "zod";

const SalesStatusEnum = z.enum([
  "DRAFT",
  "CONFIRMED",
  "INVOICED",
  "CANCELLED",
]);

export const createSalesSchema = z.object({
  branchId: z
    .string({
      required_error: "Branch ID is required",
    })
    .uuid("Invalid Branch ID"),

  customerId: z
    .string()
    .uuid("Invalid Customer ID")
    .optional()
    .nullable(),

  orderNumber: z
    .string()
    .trim()
    .min(1, "Order Number is required"),

  status: SalesStatusEnum.default("DRAFT"),

  orderDate: z
    .string()
    .datetime()
    .optional(),

  totalAmount: z
    .number({
      required_error: "Total Amount is required",
    })
    .min(0),

  taxAmount: z
    .number()
    .min(0)
    .default(0),

  discountAmount: z
    .number()
    .min(0)
    .default(0),

  netAmount: z
    .number({
      required_error: "Net Amount is required",
    })
    .min(0),
});

export const updateSalesSchema = createSalesSchema.partial();

export default {
  createSalesSchema,
  updateSalesSchema,
};