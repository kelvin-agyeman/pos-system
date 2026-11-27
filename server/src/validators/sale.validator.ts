import { z } from "zod";

const parseNumberInput = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : Number(trimmed);
  }
  return val;
};

const positiveIntNumber = (label: string) =>
  z
    .number({ error: `${label} must be a valid number` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be greater than 0`);

const positiveIntSchema = (label: string) =>
  z.preprocess(parseNumberInput, positiveIntNumber(label));

const optionalCustomerIdSchema = z.preprocess(
  parseNumberInput,
  positiveIntNumber("Customer ID").optional(),
);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === "" || val === null ? undefined : val));

const paymentMethodSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((val) => val.replace(/\s+/g, "_"))
  .pipe(z.enum(["CASH", "MOBILE_MONEY", "CREDIT_CARD"]));

const saleItemSchema = z.object({
  productId: positiveIntSchema("Product ID"),
  quantity: positiveIntSchema("Quantity"),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemSchema, { error: "Cart is empty" })
    .min(1, "Cart is empty"),
  cashGiven: z.preprocess(
    parseNumberInput,
    z
      .number({ error: "Cash given must be a valid number" })
      .finite("Cash given must be a valid number")
      .min(0, "Cash given cannot be negative")
      .optional(),
  ),
  paymentMethod: paymentMethodSchema.optional(),
  paymentReference: optionalTrimmedString,
  customerId: optionalCustomerIdSchema,
});
