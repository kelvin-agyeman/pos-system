import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(100, "Full name must be at most 100 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? undefined : val)),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (val) => val === "" || z.email().safeParse(val).success,
      "Please provide a valid email address",
    )
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? undefined : val)),
});
