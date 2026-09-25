"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Cuántos elementos se ven antes de pulsar "Ver más". */
export const SHOW_MORE_LIMIT = 10;

/**
 * Lista larga en un contenedor de altura limitada con scroll vertical: muestra
 * los 10 primeros y, al final, un botón "Ver más" que despliega el resto.
 */
export function ShowMoreList<T>({
  items,
  limit = SHOW_MORE_LIMIT,
  children,
}: {
  items: T[];
  limit?: number;
  children: (visible: T[]) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - limit;
  const visible = expanded ? items : items.slice(0, limit);

  return (
    <>
      <div className="max-h-[28rem] overflow-y-auto overscroll-contain pr-1 [scrollbar-color:var(--color-slate-300)_transparent] [scrollbar-width:thin]">
        {children(visible)}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/70 py-2.5 text-sm font-semibold text-brand-600 transition-all duration-200 hover:-translate-y-px hover:border-brand-200 hover:bg-brand-50"
        >
          {expanded ? (
            <>
              Ver menos <ChevronUp className="size-4" />
            </>
          ) : (
            <>
              Ver más ({hidden}) <ChevronDown className="size-4" />
            </>
          )}
        </button>
      )}
    </>
  );
}
