import Link from "next/link";

type Props = {
  href: string;
  name: string;
  year: number | null;
  thumbnail: string | null;
  /** Number of extra variants beyond the base. */
  extraCount?: number;
};

/** Museum model card (light theme): 16:9 Sketchfab thumbnail, name + year below. */
export function ModelCard({ href, name, year, thumbnail, extraCount = 0 }: Props) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
    >
      {/* 16:9 matches Sketchfab thumbnails exactly → no crop */}
      <div className="relative aspect-video overflow-hidden bg-[#ecebe8]">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center font-serif text-xl text-neutral-400">
            {name}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium tracking-tight text-neutral-900">
            {name}
          </h3>
          {extraCount > 0 && (
            <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.15em] text-neutral-400">
              +{extraCount} variante{extraCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-neutral-400">
          {year ?? "—"}
        </span>
      </div>
    </Link>
  );
}
