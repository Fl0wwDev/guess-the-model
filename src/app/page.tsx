import Link from "next/link";
import { MUSEUM_BRANDS } from "@/content/museum";
import { QUIZ_POOL_SIZE } from "@/content/quiz";
import { SiteHeader } from "@/components/ui/SiteHeader";

// Home = a plain typographic menu in the museum's own light editorial language.
// No Sketchfab viewer, no poster, no carousel: the landing must paint instantly
// and never wait on a third party. All 3D lives in the museum and the quiz.
export default function Home() {
  const brands = MUSEUM_BRANDS.length;
  const models = MUSEUM_BRANDS.reduce((n, b) => n + b.models.length, 0);

  const entries = [
    {
      href: "/musee",
      label: "Le Musée",
      meta: `${models} modèles · ${brands} marques`,
      desc: "Traversez l’histoire, marque par marque.",
    },
    {
      href: "/quiz",
      label: "Le Quiz",
      meta: `${QUIZ_POOL_SIZE} voitures`,
      desc: "Un détail, quatre réponses. Reconnaîtrez-vous la voiture ?",
    },
    {
      href: "/a-propos",
      label: "À propos",
      meta: "",
      desc: "Ce que c’est, et d’où viennent les voitures.",
    },
  ];

  return (
    <main className="flex min-h-dvh flex-col">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 md:px-10 md:py-20">
        <p className="mb-8 text-[0.7rem] uppercase tracking-[0.4em] text-accent">
          Collection privée
        </p>
        <h1 className="font-serif text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.02em]">
          Devinez
          <br />
          <span className="italic text-muted">la voiture.</span>
        </h1>

        <nav className="mt-14 md:mt-20">
          <ul className="border-t border-rule">
            {entries.map((e, i) => (
              <li key={e.label}>
                <Link
                  href={e.href}
                  className="group relative flex items-start gap-5 border-b border-rule py-6 transition-colors hover:border-accent/40 md:py-7"
                >
                  <span className="w-8 shrink-0 pt-1.5 font-mono text-[0.7rem] tabular-nums text-muted/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="text-2xl uppercase tracking-[0.14em] transition-[color,transform] duration-300 group-hover:translate-x-1.5 group-hover:text-accent md:text-[2rem]">
                        {e.label}
                      </span>
                      {e.meta && (
                        <span className="text-[0.7rem] uppercase tracking-[0.25em] text-muted/70">
                          {e.meta}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-sm text-muted">
                      {e.desc}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 self-center text-xl text-muted/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-rule px-6 py-6 text-[0.7rem] uppercase tracking-[0.25em] text-muted/70 md:px-10">
        <span>Modèles 3D — Ddiaz Design · CC BY-NC-SA</span>
        <span>Fan project · non commercial</span>
      </footer>
    </main>
  );
}
