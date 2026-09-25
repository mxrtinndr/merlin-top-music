"use client";

import { cn } from "@/lib/cn";

/** Campo de PIN de 4 dígitos con teclado numérico en móvil. */
export function PinInput({
  id,
  value,
  onChange,
  onComplete,
  autoFocus,
  invalid,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  invalid?: boolean;
  label: string;
}) {
  return (
    <input
      id={id}
      aria-label={label}
      value={value}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
        onChange(digits);
        if (digits.length === 4) onComplete?.(digits);
      }}
      inputMode="numeric"
      autoComplete="off"
      pattern="[0-9]{4}"
      maxLength={4}
      autoFocus={autoFocus}
      placeholder="••••"
      className={cn(
        "h-14 w-full rounded-2xl border bg-surface text-center font-display text-3xl tracking-[0.6em] text-ink",
        "placeholder:text-slate-300 focus:outline-none focus:ring-4",
        invalid
          ? "border-rose-300 focus:ring-rose-500/10"
          : "border-slate-200 focus:border-brand-400 focus:ring-brand-500/10",
      )}
    />
  );
}
