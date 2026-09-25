import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/60 bg-surface shadow-card transition-shadow duration-300 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-semibold uppercase tracking-[0.14em] text-brand-500", className)}
      {...props}
    />
  );
}
