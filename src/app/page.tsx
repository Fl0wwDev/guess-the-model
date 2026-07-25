import Link from "next/link";
import Experience from "@/components/three/Experience";
import GarageControls from "@/components/ui/GarageControls";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* 3D layer — receives pointer events for orbit/zoom */}
      <div className="absolute inset-0">
        <Experience />
      </div>

      {/* Overlay UI — pointer-events-none so drags reach the canvas;
          interactive children opt back in with pointer-events-auto */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-8 md:p-14">
        <header className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-muted">
            Guess the Model
          </span>
          <Link
            href="/musee"
            className="pointer-events-auto rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] backdrop-blur-md transition hover:border-accent/60 hover:text-foreground"
          >
            Musée →
          </Link>
        </header>

        <GarageControls />

        <footer className="text-xs text-muted">
          Fais glisser pour orbiter · molette pour zoomer
        </footer>
      </div>
    </main>
  );
}
