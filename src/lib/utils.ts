import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as HUF with thousands separators, e.g. 89900 → "89 900 Ft". */
export function formatHuf(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(value))} Ft`;
}

/** Format an ISO date string to hu-HU long-ish format, e.g. "2026. 07. 12." */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** True when a country flag value is an image URL rather than an emoji. */
export function isFlagUrl(flag: string | undefined): boolean {
  return !!flag && /^https?:\/\//.test(flag);
}
