import { z } from "zod";

// ==========================================
// Enums
// ==========================================

const PaymentMethod = z.enum([
  "CASH",
  "CARD",
  "BANK",
  "WALLET",
  "OTHER",
]);

const PaymentStatus = z.enum([
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

// ==========================================
// Create Payment Validation
// ==========================================

export const createPaymentSchema = z.object({
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

  supplierId: z
    .string()
    .uuid("Invalid Supplier ID")
    .optional()
    .nullable(),

  invoiceId: z
    .string()
    .uuid("Invalid Invoice ID")
    .optional()
    .nullable(),

  purchaseOrderId: z
    .string()
    .uuid("Invalid Purchase Order ID")
    .optional()
    .nullable(),

  paymentNumber: z
    .string({
      required_error: "Payment Number is required",
    })
    .min(1, "Payment Number cannot be empty"),

  paymentDate: z
    .string({
      required_error: "Payment Date is required",
    })
    .datetime("Invalid Payment Date"),

  amount: z
    .number({
      required_error: "Amount is required",
    })
    .positive("Amount must be greater than zero"),

  method: PaymentMethod,

  referenceNumber: z
    .string()
    .max(100)
    .optional()
    .nullable(),

  status: PaymentStatus.default("PENDING"),

  notes: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

// ==========================================
// Update Payment Validation
// ==========================================

export const updatePaymentSchema =
  createPaymentSchema.partial();

// ==========================================
// Export
// ==========================================

export default {
  createPaymentSchema,
  updatePaymentSchema,
};