import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:bg-deep-600 hover:shadow-md active:bg-deep-700",
  secondary:
    "border border-slate-200 bg-surface text-brand-800 hover:border-brand-200 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "border border-rose-200 bg-surface text-rose-600 hover:bg-rose-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out",
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
