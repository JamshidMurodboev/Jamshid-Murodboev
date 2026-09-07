import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " UZS";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function computePaymentStatus(
  dueDate: Date,
  amountDue: number,
  amountPaid: number
): "PAID" | "PENDING" | "OVERDUE" {
  if (amountPaid >= amountDue) return "PAID";
  if (new Date() > new Date(dueDate)) return "OVERDUE";
  return "PENDING";
}
