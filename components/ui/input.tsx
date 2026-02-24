import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-md border border-slate-300 px-3 py-2", className)} {...props} />;
}
