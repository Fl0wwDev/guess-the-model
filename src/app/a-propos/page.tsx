import type { Metadata } from "next";
import { MUSEUM_BRANDS } from "@/content/museum";
import { categoryCounts } from "@/content/categories";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "À propos — Guess the Model",
  description:
    "Un projet de passionné : un musée automobile en 3D et un quiz.",
};

export default function AProposPage() {
  const brands = MUSEUM_BRANDS.length;
  const models = MUSEUM_BRANDS.reduce((n, b) => n + b.models.length, 0);
  const variants = MUSEUM_BRANDS.reduce(
    (n, b) => n + b.models.reduce((k, m) => k + m.variants.length, 0),
    0
  );
  const cats = categoryCounts();

  return (
    <main className="flex min-h-dvh flex-col">
      <SiteHeader />

      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
          À propos
        </h1>

        <dl className="mt-12 grid grid-cols-2 gap-4 border-y border-rule py-6 sm:grid-cols-4">
          {[
            ["Marques", brands],
            ["Modèles", models],
            ["Variantes", variants],
            ["Sportives", cats.sportive],
          ].map(([label, n]) => (
            <div key={String(label)}>
              <dt className="text-[0.62rem] uppercase tracking-[0.25em] text-muted">
                {label}
              </dt>
              <dd className="mt-1 font-serif text-3xl tabular-nums md:text-4xl">
                {n}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 space-y-6 text-base leading-relaxed text-muted">
          <p>
            <span className="text-foreground">Guess the Model</span> est un
            projet personnel, non commercial, fait par passion de l’automobile.
            Deux volets : un <span className="text-foreground">musée</span> où
            l’on traverse l’histoire d’un constructeur modèle par modèle, et un{" "}
            <span className="text-foreground">quiz</span> où l’on reconnaît une
            voiture à partir d’un gros plan.
          </p>
          <p>
            Chaque voiture est un modèle 3D diffusé par Sketchfab et manipulable
            directement dans la page : faites glisser pour tourner autour,
            molette pour zoomer. Rien n’est hébergé ici — le rendu se fait sur
            l’infrastructure de Sketchfab, ce qui veut dire aussi qu’une
            connexion internet est nécessaire.
          </p>
        </div>

        <section className="mt-14 border-t border-rule pt-8">
          <h2 className="font-serif text-2xl italic">
            Pourquoi le quiz montre d’abord une photo
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Le lecteur 3D de Sketchfab affiche toujours le nom du modèle en haut
            à gauche : l’option qui le masque est réservée aux comptes payants,
            et masquer cette barre soi-même serait contraire à leurs conditions.
            Le quiz pose donc sa question sur un gros plan photo — pendant que
            vous cherchez, la 3D se charge en arrière-plan — puis révèle le
            modèle en 3D une fois la réponse donnée. Le temps de chargement
            devient du temps de réflexion.
          </p>
        </section>

        <section className="mt-14 border-t border-rule pt-8">
          <h2 className="font-serif text-2xl italic">Crédits</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              Les {variants} modèles 3D sont l’œuvre de{" "}
              <a
                href="https://sketchfab.com/Ddiaz-design"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline decoration-black/25 underline-offset-4 transition hover:decoration-accent"
              >
                Ddiaz Design
              </a>
              , diffusés sous licence Creative Commons BY-NC-SA 4.0. Chaque
              fiche renvoie vers le modèle d’origine.
            </p>
            <p>
              Les photographies d’ambiance des marques proviennent de Wikimedia
              Commons, sous licences libres — le détail par image est dans le
              fichier{" "}
              <code className="text-foreground">public/brands/CREDITS.md</code>.
            </p>
            <p>
              Les noms, logos et silhouettes des constructeurs appartiennent à
              leurs propriétaires respectifs. Ce site n’est affilié à aucun
              d’entre eux.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
