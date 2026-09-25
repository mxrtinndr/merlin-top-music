"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { DailyPick, Rating } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useIdentity } from "@/components/identity/identity-provider";
import { RatingPanel } from "@/components/ratings/rating-panel";
import { PickCard } from "./pick-card";
import { PickForm } from "./pick-form";

/** Canción + votos. La persona presentadora puede editarla el mismo día. */
export function PickDetail({
  pick,
  ratings,
  editable,
  showDate,
}: {
  pick: DailyPick;
  ratings: Rating[];
  editable: boolean;
  showDate?: boolean;
}) {
  const { currentMember, memberById } = useIdentity();
  const [editing, setEditing] = useState(false);
  const presenter = memberById(pick.presenter_id);
  const canEdit = editable && presenter !== undefined && currentMember?.id === pick.presenter_id;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <PickCard
        pick={pick}
        presenter={presenter}
        showDate={showDate}
        className="md:col-span-2 lg:col-span-1"
        action={
          canEdit ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Editar
            </Button>
          ) : null
        }
      />
      <RatingPanel pick={pick} ratings={ratings} />

      {canEdit && (
        <Modal open={editing} onClose={() => setEditing(false)} title="Editar la canción del día" className="sm:max-w-xl">
          <PickForm mode="edit" pick={pick} presenter={presenter} onDone={() => setEditing(false)} />
        </Modal>
      )}
    </div>
  );
}
