import { z } from "zod";

// ==========================================
// Enums
// ==========================================

const InvoiceStatus = z.enum([
  "DRAFT",
  "ISSUED",
  "CANCELLED",
]);

const PaymentStatus = z.enum([
  "PENDING",
  "PARTIAL",
  "PAID",
  "REFUNDED",
]);

// ==========================================
// Create Invoice Validation
// ==========================================

export const createInvoiceSchema = z.object({
  branchId: z
    .string({
      required_error: "Branch ID is required",
    })
    .uuid("Invalid Branch ID"),

  salesOrderId: z
    .string()
    .uuid("Invalid Sales Order ID")
    .optional()
    .nullable(),

  customerId: z
    .string({
      required_error: "Customer ID is required",
    })
    .uuid("Invalid Customer ID"),

  invoiceNumber: z
    .string({
      required_error: "Invoice Number is required",
    })
    .min(1, "Invoice Number cannot be empty"),

  invoiceDate: z
    .string({
      required_error: "Invoice Date is required",
    })
    .datetime("Invalid Invoice Date"),

  dueDate: z
    .string()
    .datetime("Invalid Due Date")
    .optional()
    .nullable(),

  subtotal: z
    .number({
      required_error: "Subtotal is required",
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

  totalAmount: z
    .number({
      required_error: "Total Amount is required",
    })
    .min(0),

  paidAmount: z
    .number()
    .min(0)
    .default(0),

  balanceAmount: z
    .number()
    .min(0),

  paymentStatus: PaymentStatus.default("PENDING"),

  status: InvoiceStatus.default("DRAFT"),

  notes: z
    .string()
    .max(500)
    .optional()
    .nullable(),
});

// ==========================================
// Update Invoice Validation
// ==========================================

export const updateInvoiceSchema =
  createInvoiceSchema.partial();

// ==========================================
// Export
// ==========================================

export default {
  createInvoiceSchema,
  updateInvoiceSchema,
};