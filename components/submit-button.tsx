"use client";
import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

export function SubmitButton({ children, pendingText = "Guardando…", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} className={className} disabled={pending || props.disabled} aria-disabled={pending || props.disabled}>{pending ? pendingText : children}</button>;
}
