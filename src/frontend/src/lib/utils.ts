import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * Outputs: ₹950, ₹9,100, ₹1,50,000
 * Always uses the literal ₹ character — never \u20b9 escape sequences.
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  // Safety net: some environments output \u20b9 as literal 6-char escape.
  // Replace all variants with the actual ₹ character.
  return sanitizeCurrencyString(formatted);
}

/**
 * Internal helper — replaces all known encoded forms of ₹ and — with real chars.
 * Handles: literal \u20b9 (6 chars), \\u20b9 (7 chars), %E2%82%B9 (URL-encoded),
 * and the double-encoded \\\\u20b9 variant.
 */
function sanitizeCurrencyString(str: string): string {
  if (typeof str !== "string") return str;
  return (
    str
      // URL-encoded ₹
      .replace(/%E2%82%B9/gi, "₹")
      // Double-backslash encoded (\\u20b9 stored as literal chars)
      .replace(/\\\\u20[bB]9/g, "₹")
      // Single-backslash encoded (\u20b9 stored as literal chars, 6 chars)
      .replace(/\\u20[bB]9/g, "₹")
      // URL-encoded em dash
      .replace(/%E2%80%94/gi, "—")
      // Double-backslash em dash
      .replace(/\\\\u2014/g, "—")
      // Single-backslash em dash
      .replace(/\\u2014/g, "—")
  );
}

/**
 * Decode double-encoded unicode strings (e.g. "\\u20b9" → "₹").
 * Safe to call on already-decoded strings.
 */
export function decodeUnicode(str: string): string {
  if (typeof str !== "string") return str;
  // First pass: sanitize known currency/dash patterns
  const sanitized = sanitizeCurrencyString(str);
  // Second pass: attempt JSON-parse decode for any remaining escapes
  try {
    // Only attempt if there's a backslash-u pattern remaining
    if (!/\\u[0-9a-fA-F]{4}/.test(sanitized)) return sanitized;
    const escaped = sanitized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return JSON.parse(`"${escaped}"`);
  } catch {
    return sanitized;
  }
}

/**
 * Universal currency display helper.
 * - Numbers: formats with formatCurrency() then sanitizes
 * - Strings: decodes any unicode escapes then sanitizes
 * - Ensures ₹ always renders correctly regardless of input source
 */
export function sanitizeCurrency(value: number | string): string {
  if (typeof value === "number") {
    return formatCurrency(value);
  }
  // String path: decode unicode then sanitize
  const decoded = decodeUnicode(value);
  return sanitizeCurrencyString(decoded);
}
