"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Move, ZoomIn, ZoomOut } from "lucide-react";
import { cropAvatar, type ProcessedPhoto, type SquareCrop } from "@/lib/image";
import { Button } from "@/components/ui/button";

/** Lado del visor en px. */
const VIEW = 240;
const MAX_ZOOM = 4;
/** Paso de las flechas del teclado, en px del visor. */
const KEY_STEP = 10;

type Offset = { x: number; y: number };

/**
 * Encuadre de la foto de perfil: se arrastra para moverla y se amplía con la
 * barra o la rueda del ratón. Lo que queda dentro del círculo es la foto final.
 */
export function AvatarCropper({
  bitmap,
  onCancel,
  onConfirm,
}: {
  bitmap: ImageBitmap;
  onCancel: () => void;
  onConfirm: (photo: ProcessedPhoto) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerX: number; pointerY: number; offset: Offset } | null>(null);
  // Escala a la que la imagen cubre justo el visor (zoom = 1).
  const baseScale = VIEW / Math.min(bitmap.width, bitmap.height);
  const [zoom, setZoom] = useState(1);
  // Posición de la esquina superior izquierda de la imagen dentro del visor. De
  // entrada, centrada y, en fotos verticales, algo subida: ahí suele estar la cara.
  const [offset, setOffset] = useState<Offset>(() => ({
    x: (VIEW - bitmap.width * baseScale) / 2,
    y: (VIEW - bitmap.height * baseScale) * 0.3,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scale = baseScale * zoom;

  /** La imagen siempre cubre el visor: sin huecos en los bordes. */
  const clamp = (next: Offset, atScale: number): Offset => ({
    x: Math.min(0, Math.max(VIEW - bitmap.width * atScale, next.x)),
    y: Math.min(0, Math.max(VIEW - bitmap.height * atScale, next.y)),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = VIEW * ratio;
    canvas.height = VIEW * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.imageSmoothingQuality = "high";
    context.clearRect(0, 0, VIEW, VIEW);
    context.drawImage(bitmap, offset.x, offset.y, bitmap.width * scale, bitmap.height * scale);
  }, [bitmap, offset, scale]);

  // La rueda hace zoom en el visor y no debe desplazar la página ni el modal.
  // React registra onWheel como pasivo, así que el preventDefault va aparte.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const block = (event: WheelEvent) => event.preventDefault();
    viewport.addEventListener("wheel", block, { passive: false });
    return () => viewport.removeEventListener("wheel", block);
  }, []);

  /** Cambia el zoom manteniendo fijo el centro del visor. */
  const applyZoom = (nextZoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
    const nextScale = baseScale * clamped;
    const centerX = (VIEW / 2 - offset.x) / scale;
    const centerY = (VIEW / 2 - offset.y) / scale;
    setZoom(clamped);
    setOffset(clamp({ x: VIEW / 2 - centerX * nextScale, y: VIEW / 2 - centerY * nextScale }, nextScale));
  };

  const confirm = async () => {
    const crop: SquareCrop = { x: -offset.x / scale, y: -offset.y / scale, size: VIEW / scale };
    setSaving(true);
    setError(null);
    try {
      onConfirm(await cropAvatar(bitmap, crop));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recortar la foto.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-brand-900">
        <Move className="size-4 text-brand-500" /> Arrastra la foto y ajusta el zoom para encuadrarla
      </p>

      <div
        ref={viewportRef}
        className="relative mx-auto touch-none select-none overflow-hidden rounded-full bg-slate-200 shadow-card ring-4 ring-surface cursor-grab active:cursor-grabbing focus-visible:outline-2"
        style={{ width: VIEW, height: VIEW }}
        tabIndex={0}
        role="application"
        aria-label="Encuadre de la foto. Usa las flechas para moverla y + o − para el zoom."
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointerX: event.clientX, pointerY: event.clientY, offset };
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) return;
          setOffset(
            clamp(
              { x: start.offset.x + event.clientX - start.pointerX, y: start.offset.y + event.clientY - start.pointerY },
              scale,
            ),
          );
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(event) => applyZoom(zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1))}
        onKeyDown={(event) => {
          const moves: Record<string, Offset> = {
            ArrowLeft: { x: KEY_STEP, y: 0 },
            ArrowRight: { x: -KEY_STEP, y: 0 },
            ArrowUp: { x: 0, y: KEY_STEP },
            ArrowDown: { x: 0, y: -KEY_STEP },
          };
          const move = moves[event.key];
          if (move) {
            event.preventDefault();
            setOffset(clamp({ x: offset.x + move.x, y: offset.y + move.y }, scale));
          } else if (event.key === "+" || event.key === "=") {
            applyZoom(zoom * 1.1);
          } else if (event.key === "-") {
            applyZoom(zoom / 1.1);
          }
        }}
      >
        <canvas ref={canvasRef} className="pointer-events-none" style={{ width: VIEW, height: VIEW }} />
      </div>

      <label className="mx-auto flex max-w-60 items-center gap-2 text-slate-500">
        <ZoomOut className="size-4 shrink-0" aria-hidden />
        <span className="sr-only">Zoom</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => applyZoom(Number(event.target.value))}
          className="w-full accent-brand-500"
        />
        <ZoomIn className="size-4 shrink-0" aria-hidden />
      </label>

      {error && <p className="text-center text-sm text-rose-600">{error}</p>}

      <div className="flex justify-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={confirm} loading={saving}>
          <Check className="size-3.5" /> Usar esta foto
        </Button>
      </div>
    </div>
  );
}
