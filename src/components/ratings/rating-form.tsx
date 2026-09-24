"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createRating, errorMessage } from "@/lib/mutations";
import { isValidScore, SCORE_OPTIONS } from "@/lib/scores";
import { Button } from "@/components/ui/button";
import { FormError, Textarea } from "@/components/ui/field";

const COMMENT_MAX = 280;

export function RatingForm({ pickId, memberId }: { pickId: string; memberId: string }) {
  const router = useRouter();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (score === null || !isValidScore(score)) return setError("Elige una puntuación.");
    setSaving(true);
    setError(null);
    try {
      await createRating({ daily_pick_id: pickId, member_id: memberId, score, comment: comment.trim() || null });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      startRefresh(() => router.refresh());
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div role="radiogroup" aria-label="Puntuación" className="grid grid-cols-4 gap-2">
        {SCORE_OPTIONS.map((option) => {
          const selected = score === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setScore(option.value)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 transition",
                selected
                  ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/30"
                  : "border-slate-200 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50",
              )}
            >
              <span className={cn("text-2xl transition-transform", selected ? "scale-110" : "group-hover:scale-110")}>
                {option.emoji}
              </span>
              <span className="font-display text-lg font-bold leading-none">{option.value}</span>
              <span className={cn("text-[11px] font-medium leading-tight", selected ? "text-brand-50" : "text-slate-500")}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Textarea
          aria-label="Comentario opcional"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={COMMENT_MAX}
          placeholder="Un comentario breve (opcional)"
          className="min-h-20 pb-6"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums text-slate-400">
          {comment.length}/{COMMENT_MAX}
        </span>
      </div>

      <FormError message={error} />

      <Button type="submit" size="lg" className="w-full" loading={saving || refreshing} disabled={score === null}>
        Enviar puntuación
      </Button>
    </form>
  );
}
