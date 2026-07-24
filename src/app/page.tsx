import Experience from "@/components/three/Experience";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* 3D layer — receives pointer events for orbit/zoom */}
      <div className="absolute inset-0">
        <Experience />
      </div>

      {/* Overlay UI — pointer-events-none so drags reach the canvas */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-8 md:p-14">
        <header className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-muted">
            Guess the Model
          </span>
          <span className="text-xs text-muted">Prototype · v0</span>
        </header>

        <div className="max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-accent">
            Prototype 3D
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            La chaîne 3D
            <br />
            est opérationnelle.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Placeholder rendu avec React Three Fiber : éclairage studio
            (Lightformers), peinture clearcoat et post-processing. Fais glisser
            pour orbiter, molette pour zoomer.
          </p>
        </div>

        <footer className="text-xs text-muted">
          Next.js 16 · R3F 9 · three 0.185 · drei · postprocessing
        </footer>
      </div>
    </main>
  );
}
