export type ClassValue = string | boolean | null | undefined | 0 | 0n;

/** Joins truthy class names. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
