import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Member } from "@/lib/types";

const SIZES = {
  xs: { className: "size-6 text-xs", px: 24 },
  sm: { className: "size-8 text-base", px: 32 },
  md: { className: "size-10 text-lg", px: 40 },
  lg: { className: "size-14 text-2xl", px: 56 },
  xl: { className: "size-20 text-4xl", px: 80 },
} as const;

export type AvatarSize = keyof typeof SIZES;

type AvatarMember = Pick<Member, "name" | "emoji" | "color"> & { avatar_url?: string | null };

/** Foto de perfil si la hay; si no, el emoji sobre su color. */
export function MemberAvatar({
  member,
  size = "md",
  className,
}: {
  member: AvatarMember | null | undefined;
  size?: AvatarSize;
  className?: string;
}) {
  const { className: sizeClass, px } = SIZES[size];

  if (!member) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400",
          sizeClass,
          className,
        )}
        aria-hidden
      >
        ?
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full leading-none ring-2 ring-surface",
        sizeClass,
        className,
      )}
      style={{ backgroundColor: `${member.color}1f` }}
      title={member.name}
      aria-hidden
    >
      {member.avatar_url ? (
        // Ya llega recortada y reducida a 320 px: no hace falta el optimizador de Next.
        <Image src={member.avatar_url} alt="" width={px} height={px} unoptimized className="size-full object-cover" />
      ) : (
        member.emoji
      )}
      {/* Aro del color del miembro, por encima de la foto */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: `inset 0 0 0 1.5px ${member.color}${member.avatar_url ? "aa" : "55"}` }}
      />
    </span>
  );
}

export function MemberChip({ member, className }: { member: AvatarMember | null | undefined; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium text-brand-900", className)}>
      <MemberAvatar member={member} size="xs" />
      {member?.name ?? "Alguien"}
    </span>
  );
}
