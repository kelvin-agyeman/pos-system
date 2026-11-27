import { z } from "zod";

const parseNumberInput = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }
  return val;
};

const optionalTrimmedString = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} must be at most ${maxLength} characters`)
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === null ? undefined : val));

const priceSchema = z
  .number({ error: "Price must be a valid number" })
  .positive("Price must be greater than 0");

const quantitySchema = z
  .number({ error: "Quantity must be a valid number" })
  .int("Quantity must be a whole number")
  .min(0, "Quantity cannot be negative");

export const createProductSchema = z.object({
  name: z
    .string({ error: "Product name is required" })
    .trim()
    .min(1, "Product name is required")
    .max(150, "Product name must be at most 150 characters"),
  price: z.preprocess(parseNumberInput, priceSchema),
  quantity: z.preprocess(parseNumberInput, quantitySchema),
  category: z
    .string({ error: "Category is required" })
    .trim()
    .min(1, "Category is required")
    .max(100, "Category must be at most 100 characters"),
});

export const updateProductSchema = z.object({
  name: optionalTrimmedString(150, "Product name"),
  price: z.preprocess(parseNumberInput, priceSchema.optional()),
  quantity: z.preprocess(parseNumberInput, quantitySchema.optional()),
  category: optionalTrimmedString(100, "Category"),
});
