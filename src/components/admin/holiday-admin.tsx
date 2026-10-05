"use client";

import { useState } from "react";
import { PartyPopper, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { addDaysISO, formatDayBadge, formatLongDate, isWorkday, nextWorkdayISO, relativeDayLabel } from "@/lib/dates";
import { adminDeleteHoliday, adminSetHoliday } from "@/lib/mutations";
import type { Holiday } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { ShowMoreList } from "@/components/ui/show-more";
import { useAdminCredentials } from "./admin-gate";
import { useSaving } from "./use-saving";

/**
 * Días festivos: ese día no hay canción y el turno pasa al siguiente día
 * laborable. Si la fecha ya era festivo, se actualiza su nombre.
 */
export function HolidayAdmin({ holidays, today }: { holidays: Holiday[]; today: string }) {
  const upcoming = holidays.filter((holiday) => holiday.date >= today);
  const past = holidays.filter((holiday) => holiday.date < today).reverse();
  const holidayDates = holidays.map((holiday) => holiday.date);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <AddHolidayCard today={today} holidayDates={holidayDates} />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title="Próximos festivos"
            subtitle={upcoming.length === 1 ? "1 día sin canción" : `${upcoming.length} días sin canción`}
            className="mb-3"
          />
          <HolidayRows holidays={upcoming} today={today} empty="No hay festivos a la vista. ¡A trabajar! 🎶" />
        </Card>

        {past.length > 0 && (
          <Card className="p-5 sm:p-6">
            <CardHeader title="Ya pasaron" subtitle="Festivos de este año." className="mb-3" />
            <HolidayRows holidays={past} today={today} />
          </Card>
        )}
      </div>
    </div>
  );
}

function AddHolidayCard({ today, holidayDates }: { today: string; holidayDates: string[] }) {
  const admin = useAdminCredentials();
  const { run, busy, error, setError } = useSaving();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const weekend = date !== "" && !isWorkday(date);

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-amber-200/40 blur-3xl" aria-hidden />
      <CardHeader
        title="Marcar un festivo"
        subtitle="Ese día no hay canción: quien presente el día anterior nomina para el siguiente día laborable."
        className="relative mb-5"
      />
      <form
        className="relative space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!date) return;
          if (weekend) {
            setError("Ese día ya es fin de semana: no hace falta marcarlo.");
            return;
          }
          const saved = await run(() => adminSetHoliday(admin, date, name.trim() || null));
          if (saved) {
            setDate("");
            setName("");
          }
        }}
      >
        <Field label="Día" htmlFor="holiday-date" hint={date && !weekend ? <TurnHint date={date} today={today} holidayDates={holidayDates} /> : undefined}>
          <Input id="holiday-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Nombre" htmlFor="holiday-name" optional>
          <Input
            id="holiday-name"
            value={name}
            maxLength={60}
            placeholder="Ej.: Día de Galicia"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <FormError message={weekend ? "Ese día ya es fin de semana: no hace falta marcarlo." : error} />
        <Button type="submit" className="w-full" loading={busy} disabled={!date || weekend}>
          <Plus className="size-4" /> Marcar como festivo
        </Button>
      </form>
    </Card>
  );
}

/** "El turno del martes nominará para el jueves": cómo queda la cadena alrededor del festivo. */
function TurnHint({ date, today, holidayDates }: { date: string; today: string; holidayDates: string[] }) {
  let before = addDaysISO(date, -1);
  while (!isWorkday(before, holidayDates)) before = addDaysISO(before, -1);
  const after = nextWorkdayISO(date, holidayDates);
  const from = formatDayBadge(before);
  const to = formatDayBadge(after);
  return (
    <>
      {date === today ? "Hoy" : `El ${formatLongDate(date)}`} no habrá canción: quien presente el {from.weekday}{" "}
      {from.day} nominará para el {to.weekday} {to.day}.
    </>
  );
}

function HolidayRows({ holidays, today, empty }: { holidays: Holiday[]; today: string; empty?: string }) {
  if (holidays.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ShowMoreList items={holidays}>
      {(visible) => (
        <ul className="divide-y divide-slate-100">
          {visible.map((holiday) => (
            <HolidayRow key={holiday.date} holiday={holiday} today={today} />
          ))}
        </ul>
      )}
    </ShowMoreList>
  );
}

function HolidayRow({ holiday, today }: { holiday: Holiday; today: string }) {
  const admin = useAdminCredentials();
  const { run, busy, error } = useSaving();
  const { weekday, day, month } = formatDayBadge(holiday.date);
  const isPast = holiday.date < today;

  const remove = () => {
    if (!window.confirm(`¿Quitar el festivo del ${formatLongDate(holiday.date)}? Ese día volverá a haber canción.`)) return;
    run(() => adminDeleteHoliday(admin, holiday.date));
  };

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 leading-none",
            isPast
              ? "bg-slate-100 text-slate-500"
              : "bg-linear-to-br from-amber-400 to-rose-500 text-white shadow-sm",
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide">{weekday}</span>
          <span className="font-display text-lg font-bold">{day}</span>
          <span className="text-[10px] uppercase opacity-80">{month}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("flex items-center gap-1.5 truncate font-semibold", isPast ? "text-slate-500" : "text-brand-900")}>
            {!isPast && <PartyPopper className="size-3.5 shrink-0 text-amber-500" aria-hidden />}
            {holiday.name ?? "Festivo"}
          </p>
          <p className="text-xs text-slate-500 first-letter:uppercase">
            {isPast ? formatLongDate(holiday.date) : relativeDayLabel(holiday.date, today)}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={remove}
          disabled={busy}
          aria-label={`Quitar el festivo del ${formatLongDate(holiday.date)}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {error && <FormError message={error} />}
    </li>
  );
}
