import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate-400 " +
  "transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

export function Field({
  label,
  hint,
  htmlFor,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-sm font-medium text-brand-900">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400">opcional</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL, "h-11 appearance-auto", className)} {...props} />;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      {message}
    </p>
  );
}
