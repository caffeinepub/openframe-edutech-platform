import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * Outputs: ₹950, ₹9,100, ₹1,50,000
 *
 * IMPORTANT: We intentionally do NOT use Intl.NumberFormat with
 * style:"currency" / currency:"INR" because in certain JS environments
 * (older V8, some mobile browsers) it emits the literal 6-character
 * escape sequence \u20b9 as plain text rather than the ₹ glyph.
 *
 * Instead we format numbers only (no currency style) and prepend the
 * actual ₹ character directly in source code as a UTF-8 literal.
 */
export function formatCurrency(amount: number | string): string {
  const num =
    typeof amount === "string" ? Number.parseFloat(amount) || 0 : (amount ?? 0);
  // Use Intl only for number grouping (en-IN gives Indian lakh/crore groups)
  const formatted = new Intl.NumberFormat("en-IN").format(num);
  // Prepend the actual ₹ character — written as a UTF-8 literal in source,
  // never as a \uXXXX escape, so the bundler preserves the real glyph.
  return `₹${formatted}`;
}

/**
 * Replace ALL known encoded forms of the ₹ symbol and — dash with real chars.
 * This is a safety net for data that was already stored with escape sequences.
 */
export function sanitizeCurrencyString(str: string): string {
  if (typeof str !== "string") return str;
  return (
    str
      // URL-encoded ₹
      .replace(/%E2%82%B9/gi, "₹")
      // Double-backslash encoded (\\u20b9 as 7 literal chars)
      .replace(/\\\\u20[bB]9/g, "₹")
      // Single-backslash encoded (\u20b9 as 6 literal chars)
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
    if (!/\\u[0-9a-fA-F]{4}/.test(sanitized)) return sanitized;
    const escaped = sanitized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return JSON.parse(`"${escaped}"`);
  } catch {
    return sanitized;
  }
}

/**
 * Universal currency display helper.
 * - Numbers: formats with formatCurrency() — always uses literal ₹
 * - Strings: sanitizes any escape sequences then returns clean value
 */
export function sanitizeCurrency(value: number | string): string {
  if (typeof value === "number") {
    return formatCurrency(value);
  }
  // String path: decode unicode escapes then sanitize
  const decoded = decodeUnicode(String(value));
  return sanitizeCurrencyString(decoded);
}
