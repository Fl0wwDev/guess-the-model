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
          <span className="text-xs text-muted">Garage · aperçu</span>
        </header>

        <GarageControls />

        <footer className="text-xs text-muted">
          Fais glisser pour orbiter · molette pour zoomer
        </footer>
      </div>
    </main>
  );
}
