import { z } from "zod";

export const createCustomerSchema = z.object({
  branchId: z.string().uuid().optional(),

  name: z
    .string()
    .trim()
    .min(2, "Customer name is required"),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),



  email: z
    .string()
    .email()
    .optional(),

  address: z
    .string()
    .optional(),

  loyaltyId: z
    .string()
    .optional(),

  creditLimit: z
    .number()
    .default(0),

  currentBalance: z
    .number()
    .default(0)
});