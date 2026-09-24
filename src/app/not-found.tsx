import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl">🔇</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-800">Esta canción no suena</h1>
      <p className="mt-2 text-slate-600">No encontramos lo que buscabas.</p>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Volver a hoy
      </Link>
    </div>
  );
}
