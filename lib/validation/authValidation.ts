/**
 * Deliberately simple (not RFC 5322) — this only decides whether to show
 * "Please enter a valid email address." before ever calling Clerk. Clerk
 * still does its own, stricter validation server-side; this is just a
 * fast, friendly first pass, not the source of truth.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH;
}
