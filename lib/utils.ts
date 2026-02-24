import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateOrderTotal(labor: number, parts: number, discount: number) {
  return Number((labor + parts - discount).toFixed(2));
}

export function buildWhatsAppLink(phone: string, message: string) {
  const cleanedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
