"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Hoja inferior en móvil, diálogo centrado en escritorio. Se pinta en <body>
 * con un portal para que ningún ancestro (p. ej. la cabecera con blur) lo recorte.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dismissible]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-deep-950/40 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 shadow-lift animate-pop",
          "sm:max-w-md sm:rounded-3xl sm:p-6",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
