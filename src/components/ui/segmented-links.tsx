import Link from "next/link";
import { cn } from "@/lib/cn";

/** Pestañas basadas en la URL (?param=valor), sin JS en cliente. */
export function SegmentedLinks<T extends string>({
  options,
  active,
  hrefFor,
  label,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  active: T;
  hrefFor: (value: T) => string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-card">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(option.value)}
          scroll={false}
          aria-current={option.value === active ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition",
            option.value === active ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30" : "text-slate-500 hover:text-brand-700",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
