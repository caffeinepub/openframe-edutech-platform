import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Decodes double-encoded Unicode escape sequences in a string.
 * e.g. "\u20b950" → "₹50"
 * Handles single-encoded and double-encoded cases.
 */
export function decodeUnicode(str: string): string {
  if (typeof str !== "string") return str;
  try {
    // If value contains literal \u sequences, decode via JSON.parse
    if (str.includes("\\u") || str.includes("\\U")) {
      const decoded = JSON.parse(`"${str.replace(/"/g, '\\"')}"`);
      // Decode again in case of double-encoding
      if (
        typeof decoded === "string" &&
        (decoded.includes("\\u") || decoded.includes("\\U"))
      ) {
        return JSON.parse(`"${decoded.replace(/"/g, '\\"')}"`);
      }
      return decoded;
    }
    return str;
  } catch {
    return str;
  }
}

/**
 * Formats a numeric amount as an Indian Rupee price string.
 * e.g. formatPrice(1500) → "₹1,500"
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Formats a fee plan price display.
 * e.g. formatFeePlan("Basic", 50) → "Basic — ₹50"
 */
export function formatFeePlan(plan: string, price: number): string {
  return `${plan} — ₹${price}`;
}
