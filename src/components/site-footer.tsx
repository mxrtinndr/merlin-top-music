import { AUTHORS } from "@/lib/config";
import { GitHubIcon, YouTubeIcon } from "@/components/brand-icons";

const ICON_LINK = "text-slate-500 transition-all duration-200 hover:-translate-y-px";

/** Pie de página: línea de marca y, en una fila por persona, su nombre y los iconos de sus perfiles. */
export function SiteFooter() {
  return (
    <footer className="mt-8 bg-surface">
      <div className="h-1 bg-linear-to-r from-deep-800 via-deep-600 to-brand-400" />
      <ul className="mx-auto max-w-6xl space-y-2 px-4 pb-28 pt-6 text-sm md:pb-8">
        {AUTHORS.map((author) => (
          <li key={author.name} className="flex items-center gap-2.5">
            <span className="font-semibold text-brand-900">{author.name}</span>
            {author.github && (
              <a
                href={author.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub de ${author.name}`}
                title={`GitHub de ${author.name}`}
                className={`${ICON_LINK} hover:text-brand-600`}
              >
                <GitHubIcon className="size-4" />
              </a>
            )}
            {author.youtube && (
              <a
                href={author.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`YouTube de ${author.name}`}
                title={`YouTube de ${author.name}`}
                className={`${ICON_LINK} hover:text-[#FF0033]`}
              >
                <YouTubeIcon className="size-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </footer>
  );
}
