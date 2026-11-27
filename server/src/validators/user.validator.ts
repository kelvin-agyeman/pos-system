import { z } from "zod";

const emptyToUndefined = (val: unknown): unknown => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return val;
};

export const updateUserSchema = z.object({
  fullName: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(50, "Name must be at most 50 characters")
      .optional(),
  ),
  username: z.preprocess((val) => {
    const normalized = emptyToUndefined(val);
    return typeof normalized === "string"
      ? normalized.toLowerCase()
      : normalized;
  }, z.string().min(4, "Username must be at least 4 characters").optional()),
  role: z.preprocess(
    (val) => {
      const normalized = emptyToUndefined(val);
      return typeof normalized === "string"
        ? normalized.toUpperCase()
        : normalized;
    },
    z.enum(["ADMIN", "CASHIER"]).optional(),
  ),
});
