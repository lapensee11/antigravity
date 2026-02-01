import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function confirmDelete(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");

  // Limit to 10 digits
  const truncated = cleaned.slice(0, 10);

  // Group by 2 digits with space
  return truncated.replace(/(\d{2})(?=\d)/g, "$1 ");
}
