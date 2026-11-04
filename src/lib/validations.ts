import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Enter your password").max(72),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(200),
  isbn: z.string().trim().min(1, "ISBN is required").max(32),
  category: z.string().trim().min(1, "Category is required").max(80),
  description: z.string().trim().max(2000),
  coverImage: z.string().trim().max(500),
  totalCopies: z.number().int().min(1, "Add at least one copy").max(500),
});

export const stockSchema = z.object({
  itemId: z.string().min(1),
  action: z.enum(["ADDED_COPIES", "LOST", "DAMAGED"]),
  quantity: z.number().int().min(1).max(500),
  reason: z.string().trim().max(200).optional(),
});

export const reserveSchema = z.object({
  itemId: z.string().min(1, "Choose an item to reserve"),
});

export const renewSchema = z.object({
  loanId: z.string().min(1, "Choose a loan to renew"),
});

export const payFineSchema = z.object({
  loanId: z.string().min(1, "Choose a fine to mark paid"),
});

export const borrowSchema = z.object({
  itemId: z.string().min(1, "Choose an item to borrow"),
});

export const returnSchema = z.object({
  loanId: z.string().min(1, "Choose a loan to return"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
