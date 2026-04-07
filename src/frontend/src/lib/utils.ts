import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * Outputs: ₹950, ₹9,100, ₹1,50,000
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Decode double-encoded unicode strings (e.g. "\\u20b9" → "₹").
 * Safe to call on already-decoded strings.
 */
export function decodeUnicode(str: string): string {
  if (typeof str !== "string") return str;
  try {
    const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return JSON.parse(`"${escaped}"`);
  } catch {
    return str;
  }
}
