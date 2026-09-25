"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { addDaysISO, formatDayBadge } from "@/lib/dates";
import type { DailyPick } from "@/lib/types";

const hrefFor = (date: string, today: string) => (date === today ? "/" : `/?dia=${date}`);

/**
 * Selector de la semana en curso: flechas ‹ › y un botón por día para pasar de
 * una canción a otra sin ir al histórico. El fin de semana solo sale si hubo canción.
 */
export function WeekNav({
  today,
  weekStart,
  selectedDate,
  weekPicks,
}: {
  today: string;
  weekStart: string;
  selectedDate: string;
  weekPicks: DailyPick[];
}) {
  const pickDates = new Set(weekPicks.map((pick) => pick.date));
  // Se puede ir a los días con canción y siempre a hoy (aunque aún no la haya).
  const reachable = [...new Set([...pickDates, today])].sort();
  const index = reachable.indexOf(selectedDate);
  const previous = index > 0 ? reachable[index - 1] : null;
  const next = index >= 0 && index < reachable.length - 1 ? reachable[index + 1] : null;

  const days = Array.from({ length: 7 }, (_, offset) => addDaysISO(weekStart, offset)).filter(
    (date, offset) => offset < 5 || pickDates.has(date) || date === today,
  );

  return (
    <div className="flex items-center gap-2">
      <ArrowLink date={previous} today={today} label="Canción anterior">
        <ChevronLeft className="size-5" />
      </ArrowLink>

      <ol className="flex flex-1 justify-between gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-surface p-1 shadow-card sm:justify-center sm:gap-2">
        {days.map((date) => {
          const { weekday, day } = formatDayBadge(date);
          const selected = date === selectedDate;
          const hasPick = pickDates.has(date);
          const enabled = reachable.includes(date);
          const content = (
            <>
              <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">
                {date === today ? "hoy" : weekday}
              </span>
              <span className="font-display text-base font-bold leading-tight">{day}</span>
              <span
                className={cn("size-1 rounded-full", hasPick ? (selected ? "bg-white" : "bg-brand-500") : "bg-transparent")}
                aria-hidden
              />
            </>
          );
          const className = cn(
            "flex min-w-11 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition",
            selected
              ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
              : enabled
                ? "text-brand-800 hover:bg-brand-50"
                : "text-slate-300",
          );
          return (
            <li key={date}>
              {enabled && !selected ? (
                <Link href={hrefFor(date, today)} scroll={false} className={className} aria-label={hasPick ? `Canción del ${weekday} ${day}` : "Hoy"}>
                  {content}
                </Link>
              ) : (
                <span className={className} aria-current={selected ? "date" : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <ArrowLink date={next} today={today} label="Canción siguiente">
        <ChevronRight className="size-5" />
      </ArrowLink>
    </div>
  );
}

function ArrowLink({
  date,
  today,
  label,
  children,
}: {
  date: string | null;
  today: string;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-surface shadow-sm transition";
  if (!date) {
    return (
      <span className={cn(className, "text-slate-300")} aria-hidden>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={hrefFor(date, today)}
      scroll={false}
      aria-label={label}
      title={label}
      className={cn(className, "text-brand-600 hover:border-brand-200 hover:bg-brand-50")}
    >
      {children}
    </Link>
  );
}
