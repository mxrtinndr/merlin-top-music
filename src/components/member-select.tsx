"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Member } from "@/lib/types";
import { MemberAvatar } from "@/components/member-avatar";

/** Con más gente que esto, el desplegable trae buscador. */
const SEARCH_FROM = 8;
const GAP = 6;
const MARGIN = 12;
const MAX_HEIGHT = 340;

type Placement = { left: number; width: number; maxHeight: number; top?: number; bottom?: number };

/** Debajo del botón si cabe; si no, encima. */
function placeNextTo(trigger: HTMLElement): Placement {
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - GAP - MARGIN;
  const above = rect.top - GAP - MARGIN;
  const base = { left: rect.left, width: rect.width };
  if (below >= 260 || below >= above) return { ...base, top: rect.bottom + GAP, maxHeight: Math.min(MAX_HEIGHT, below) };
  return { ...base, bottom: window.innerHeight - rect.top + GAP, maxHeight: Math.min(MAX_HEIGHT, above) };
}

/** Para buscar sin que importen mayúsculas ni tildes. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

/**
 * Desplegable de personas con su foto: el <select> nativo no puede mostrar
 * imágenes. La lista se pinta en <body> para que no la recorte un modal.
 */
export function MemberSelect({
  id,
  members,
  value,
  onChange,
  placeholder = "Elige a alguien…",
}: {
  id: string;
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
  placeholder?: string;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = placement !== null;
  const selected = members.find((member) => member.id === value);
  const searchable = members.length > SEARCH_FROM;
  const needle = fold(query.trim());
  const visible = needle ? members.filter((member) => fold(member.name).includes(needle)) : members;
  const optionId = (member: Member) => `${listId}-${member.id}`;
  const activeId = visible[active] ? optionId(visible[active]) : undefined;

  const openList = () => {
    if (!triggerRef.current) return;
    setQuery("");
    setActive(Math.max(0, members.findIndex((member) => member.id === value)));
    setPlacement(placeNextTo(triggerRef.current));
  };

  const close = (refocus: boolean) => {
    setPlacement(null);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (member: Member) => {
    onChange(member.id);
    close(true);
  };

  // Al abrir, el foco va al buscador (o a la lista) para manejarla con el teclado.
  useEffect(() => {
    if (open) (searchRef.current ?? listRef.current)?.focus({ preventScroll: true });
  }, [open]);

  // Sigue al botón si se hace scroll o cambia el tamaño; se cierra al pulsar fuera.
  useEffect(() => {
    if (!open) return;
    const reposition = () => triggerRef.current && setPlacement(placeNextTo(triggerRef.current));
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setPlacement(null);
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = visible.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(index + 1, last));
        return;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        return;
      case "Enter":
        event.preventDefault();
        if (visible[active]) choose(visible[active]);
        return;
      case "Escape":
        // Que no cierre también el modal en el que estemos.
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      case "Tab":
        event.preventDefault();
        close(true);
        return;
    }
    if (searchable) return; // El resto de teclas escriben en el buscador.
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === " ") {
      event.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Escribir una letra salta a la siguiente persona que empieza por ella.
      const letter = fold(event.key);
      const order = [...visible.slice(active + 1), ...visible.slice(0, active + 1)];
      const match = order.find((member) => fold(member.name).startsWith(letter));
      if (match) setActive(visible.indexOf(match));
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openList();
          }
        }}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border bg-surface pl-2 pr-3 text-left text-[15px] transition",
          "focus:outline-none focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-500/10",
          open ? "border-brand-400 ring-4 ring-brand-500/10" : "border-slate-200 hover:border-slate-300",
        )}
      >
        <MemberAvatar member={selected} size="sm" />
        <span className={cn("min-w-0 flex-1 truncate", selected ? "font-medium text-ink" : "text-slate-400")}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {placement &&
        createPortal(
          <div
            ref={popoverRef}
            onKeyDown={onKeyDown}
            style={{
              left: placement.left,
              width: placement.width,
              top: placement.top,
              bottom: placement.bottom,
              maxHeight: placement.maxHeight,
            }}
            className={cn(
              "fixed z-60 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-lift animate-pop",
              placement.top === undefined ? "origin-bottom" : "origin-top",
            )}
          >
            {searchable && (
              <div className="border-b border-slate-100 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    ref={searchRef}
                    role="combobox"
                    aria-expanded
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeId}
                    aria-label="Buscar por nombre"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActive(0);
                    }}
                    placeholder="Busca por nombre"
                    className="h-10 w-full rounded-lg bg-slate-50 pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label="Personas del equipo"
              aria-activedescendant={searchable ? undefined : activeId}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 focus:outline-none"
            >
              {visible.map((member, index) => {
                const isSelected = member.id === value;
                return (
                  <li
                    key={member.id}
                    id={optionId(member)}
                    role="option"
                    aria-selected={isSelected}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(member)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                      index === active && "bg-brand-50",
                      isSelected ? "font-semibold text-brand-800" : "text-brand-900",
                    )}
                  >
                    <MemberAvatar member={member} size="md" />
                    <span className="min-w-0 flex-1 truncate">{member.name}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-brand-500" aria-hidden />}
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  {members.length === 0 ? "No hay nadie más en el equipo." : "Nadie con ese nombre."}
                </li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
