"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { SketchfabEmbed } from "@/components/sketchfab/SketchfabEmbed";
import { ZoomStage } from "./ZoomStage";
import { buildDeck, pointsFor, type QuizQuestion } from "@/lib/quiz-deck";
import type { QuizCar } from "@/content/quiz";
import type { CarCategory } from "@/content/categories";

/** Zoom-out window = scoring window. Long enough to boot a Sketchfab viewer. */
const ROUND_MS = 14000;
const LENGTHS = [5, 10, 15] as const;

type Filter = CarCategory | "toutes";
type Phase = "setup" | "question" | "reveal" | "done";
type Result = { question: QuizQuestion; pickedId: string | null; points: number };

type Props = {
  pool: QuizCar[];
  counts: Record<Filter, number>;
};

/**
 * The quiz loop, built around one constraint: **a Sketchfab embed always prints
 * the model's name** (`ui_infos=0` is Premium-only and is rewritten server-side
 * on free accounts — verified, not assumed). So the live viewer cannot host the
 * question. It hosts the *answer* instead:
 *
 *   question → a hard zoom into the car's photo, easing out over ROUND_MS,
 *              while the viewer for that same car boots invisibly underneath
 *   answer   → the crop dissolves, the viewer is already warm, and the player
 *              gets a model they can actually orbit — name and all
 *
 * The 1–3 s boot therefore lands inside thinking time and is never felt, and
 * nothing about Sketchfab's chrome has to be hidden.
 */
export default function QuizGame({ pool, counts }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [filter, setFilter] = useState<Filter>("toutes");
  const [length, setLength] = useState<number>(10);

  const [deck, setDeck] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState<string | null>(null);

  /** Eased progress of the running round, read at answer time. Not state — it
   *  changes 60 times a second and nothing needs to re-render for it. */
  const progressRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<HTMLSpanElement>(null);

  const current = deck[index];
  const total = results.reduce((n, r) => n + r.points, 0);

  const onFrame = useCallback((p: number) => {
    progressRef.current = p;
    if (barRef.current) barRef.current.style.transform = `scaleX(${1 - p})`;
    if (pointsRef.current) pointsRef.current.textContent = String(pointsFor(p));
  }, []);

  const start = useCallback(() => {
    const filtered =
      filter === "toutes" ? pool : pool.filter((c) => c.category === filter);
    const next = buildDeck(filtered, length);
    if (!next.length) return;
    setDeck(next);
    setIndex(0);
    setResults([]);
    setPicked(null);
    setViewerReady(null);
    progressRef.current = 0;
    setPhase("question");
  }, [filter, length, pool]);

  const answer = useCallback(
    (id: string) => {
      if (phase !== "question" || !current) return;
      const good = id === current.car.id;
      setPicked(id);
      setResults((r) => [
        ...r,
        {
          question: current,
          pickedId: id,
          points: good ? pointsFor(progressRef.current) : 0,
        },
      ]);
      setPhase("reveal");
    },
    [current, phase]
  );

  const next = useCallback(() => {
    if (index + 1 >= deck.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    progressRef.current = 0;
    if (barRef.current) barRef.current.style.transform = "scaleX(1)";
    setPhase("question");
  }, [deck.length, index]);

  // 1–4 to answer, Entrée / Espace to move on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "question" && current) {
        const n = Number(e.key);
        if (n >= 1 && n <= current.options.length) {
          answer(current.options[n - 1].id);
          e.preventDefault();
        }
      } else if (phase === "reveal" && (e.key === "Enter" || e.key === " ")) {
        next();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, current, next, phase]);

  // Warm the next question's photo so the crop never pops in blank.
  useEffect(() => {
    const upcoming = deck[index + 1]?.car.image;
    if (upcoming) new Image().src = upcoming;
  }, [deck, index]);

  if (phase === "setup") {
    return (
      <Setup
        counts={counts}
        filter={filter}
        setFilter={setFilter}
        length={length}
        setLength={setLength}
        onStart={start}
      />
    );
  }

  if (phase === "done") {
    return <Summary results={results} total={total} onReplay={() => setPhase("setup")} />;
  }

  if (!current) return null;

  const revealed = phase === "reveal";
  const car = current.car;
  const lastPoints = revealed ? (results[results.length - 1]?.points ?? 0) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10 md:py-10">
      {/* ── Progress + score ─────────────────────────────────────────── */}
      <div className="mb-5 flex items-end justify-between gap-6">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
            Question {index + 1} / {deck.length}
          </p>
          <p className="mt-1 font-serif text-2xl tabular-nums">{total} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
            {revealed ? "Points gagnés" : "Points en jeu"}
          </p>
          {/* During the round this counts down 60×/s from the rAF loop; on the
              reveal it must show what was ACTUALLY banked — 0 on a wrong answer,
              not the value the clock happened to be on. */}
          {revealed ? (
            <p
              className={`mt-1 font-serif text-2xl tabular-nums ${
                lastPoints > 0 ? "text-emerald-600" : "text-muted"
              }`}
            >
              {lastPoints > 0 ? `+${lastPoints}` : "0"}
            </p>
          ) : (
            <p className="mt-1 font-serif text-2xl tabular-nums text-accent">
              <span ref={pointsRef}>1000</span>
            </p>
          )}
        </div>
      </div>

      {/* Depletes as the photo zooms out — answer early, score high. */}
      <div className="mb-6 h-[3px] w-full overflow-hidden rounded-full bg-black/10">
        <div
          ref={barRef}
          className="h-full origin-left bg-accent"
          style={{ transform: "scaleX(1)" }}
        />
      </div>

      {/* ── Stage: the live viewer boots underneath the crop ─────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-black/10 md:aspect-[16/9]">
        {/* Mounted from the first frame of the question so it is warm by the
            time the player answers. Covered by an opaque crop until then. */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            revealed && viewerReady === car.uid
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <SketchfabEmbed
            key={car.uid}
            uid={car.uid}
            title={`${car.brandName} ${car.name}`}
            cameraDistance={0.85}
            autospin={0.15}
            entranceAnimation={false}
            maxTextureSize={1024}
            onReady={setViewerReady}
            className="h-full w-full"
          />
        </div>

        <AnimatePresence>
          {!revealed && (
            <motion.div
              key={`crop-${car.id}`}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <ZoomStage
                image={car.image}
                seed={car.uid}
                durationMs={ROUND_MS}
                onFrame={onFrame}
                className="h-full w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* While the reveal waits on the viewer's first frame, keep the photo up
            rather than a black hole. */}
        {revealed && viewerReady !== car.uid && (
          <div className="absolute inset-0">
            {car.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={car.image} alt="" aria-hidden className="h-full w-full object-cover" />
            )}
            <span className="absolute bottom-4 right-5 text-[0.62rem] uppercase tracking-[0.3em] text-white/70">
              Chargement 3D…
            </span>
          </div>
        )}

        {revealed && (
          <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center p-4">
            <span
              className={`rounded-full px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.25em] backdrop-blur-md ${
                picked === car.id
                  ? "bg-emerald-600/85 text-white"
                  : "bg-accent/85 text-white"
              }`}
            >
              {picked === car.id ? "Bien vu" : "Raté"}
            </span>
          </div>
        )}
      </div>

      {/* ── Answers, then the reveal panel ───────────────────────────── */}
      {!revealed ? (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {current.options.map((opt, i) => (
            <li key={opt.id}>
              <button
                onClick={() => answer(opt.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-rule bg-white/70 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white hover:shadow-md active:scale-[0.99]"
              >
                <span className="font-mono text-[0.7rem] text-muted/60">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium tracking-tight">
                    {opt.name}
                  </span>
                  <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.2em] text-muted">
                    {opt.brandName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent">
              {car.brandName}
              {car.year ? ` · ${car.year}` : ""}
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight md:text-5xl">
              {car.name}
            </h2>
            {car.hint && (
              <p className="mt-3 text-sm text-muted">{car.hint}</p>
            )}
            {picked !== car.id && (
              <p className="mt-3 text-sm text-muted">
                Vous aviez répondu{" "}
                <span className="text-foreground">
                  {current.options.find((o) => o.id === picked)?.name ?? "—"}
                </span>
                .
              </p>
            )}
            <Link
              href={car.href}
              className="mt-4 inline-block text-[0.65rem] uppercase tracking-[0.25em] text-muted underline decoration-black/20 underline-offset-4 transition hover:text-foreground"
            >
              Voir la fiche →
            </Link>
          </div>

          <button
            onClick={next}
            className="shrink-0 rounded-full bg-foreground px-7 py-3 text-[0.7rem] uppercase tracking-[0.25em] text-background transition hover:bg-accent active:scale-95"
          >
            {index + 1 >= deck.length ? "Voir le score" : "Suivante"} →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Setup ─────────────────────────────────────────────────────────── */

function Setup({
  counts,
  filter,
  setFilter,
  length,
  setLength,
  onStart,
}: {
  counts: Record<Filter, number>;
  filter: Filter;
  setFilter: (f: Filter) => void;
  length: number;
  setLength: (n: number) => void;
  onStart: () => void;
}) {
  const available = counts[filter];
  const choices: { id: Filter; label: string; desc: string }[] = [
    { id: "toutes", label: "Toutes", desc: "Tout le catalogue" },
    { id: "sportive", label: "Sportives", desc: "Supercars, GT, voitures de course" },
    { id: "citadine", label: "Citadines", desc: "Berlines, SUV, voitures du quotidien" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <p className="text-[0.7rem] uppercase tracking-[0.4em] text-accent">
        Le Quiz
      </p>
      <h1 className="mt-4 font-serif text-[clamp(2.75rem,7vw,5rem)] leading-[0.9] tracking-tight">
        Un détail.
        <br />
        <span className="italic text-muted">Quatre réponses.</span>
      </h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
        La photo démarre en très gros plan et se dézoome peu à peu. Plus vous
        répondez tôt, plus vous marquez. Une fois la réponse donnée, la voiture
        apparaît en 3D — à faire tourner.
      </p>

      <fieldset className="mt-12">
        <legend className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
          Catégorie
        </legend>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {choices.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              aria-pressed={filter === c.id}
              className={`rounded-xl border px-5 py-4 text-left transition ${
                filter === c.id
                  ? "border-accent bg-accent/5"
                  : "border-rule bg-white/60 hover:border-black/25"
              }`}
            >
              <span className="block text-base font-medium tracking-tight">
                {c.label}
              </span>
              <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.18em] text-muted">
                {counts[c.id]} voitures
              </span>
              <span className="mt-2 block text-xs leading-snug text-muted">
                {c.desc}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="text-[0.65rem] uppercase tracking-[0.3em] text-muted">
          Nombre de questions
        </legend>
        <div className="mt-4 flex gap-3">
          {LENGTHS.map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              disabled={n > available}
              className={`rounded-full border px-6 py-2 text-sm tabular-nums transition disabled:cursor-not-allowed disabled:opacity-35 ${
                length === n
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-rule bg-white/60 hover:border-black/25"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        onClick={onStart}
        className="mt-12 rounded-full bg-foreground px-9 py-4 text-[0.7rem] uppercase tracking-[0.3em] text-background transition hover:bg-accent active:scale-95"
      >
        Commencer →
      </button>
    </div>
  );
}

/* ── Summary ───────────────────────────────────────────────────────── */

function Summary({
  results,
  total,
  onReplay,
}: {
  results: Result[];
  total: number;
  onReplay: () => void;
}) {
  const good = results.filter((r) => r.pickedId === r.question.car.id).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <p className="text-[0.7rem] uppercase tracking-[0.4em] text-accent">
        Terminé
      </p>
      <h1 className="mt-4 font-serif text-[clamp(3rem,8vw,6rem)] leading-none tracking-tight tabular-nums">
        {total}
        <span className="ml-3 align-middle text-2xl not-italic text-muted">
          pts
        </span>
      </h1>
      <p className="mt-4 text-base text-muted">
        {good} bonne{good > 1 ? "s" : ""} réponse{good > 1 ? "s" : ""} sur{" "}
        {results.length}.
      </p>

      <ul className="mt-10 border-t border-rule">
        {results.map((r, i) => {
          const ok = r.pickedId === r.question.car.id;
          return (
            <li
              key={`${r.question.car.id}-${i}`}
              className="flex items-center gap-4 border-b border-rule py-3.5"
            >
              <span
                aria-hidden
                className={`w-4 shrink-0 text-center text-sm ${
                  ok ? "text-emerald-600" : "text-accent"
                }`}
              >
                {ok ? "✓" : "✗"}
              </span>
              <Link
                href={r.question.car.href}
                className="min-w-0 flex-1 truncate text-sm transition hover:text-accent"
              >
                <span className="text-muted">{r.question.car.brandName} </span>
                {r.question.car.name}
              </Link>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                {r.points}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        onClick={onReplay}
        className="mt-10 rounded-full bg-foreground px-9 py-4 text-[0.7rem] uppercase tracking-[0.3em] text-background transition hover:bg-accent active:scale-95"
      >
        Rejouer →
      </button>
    </div>
  );
}
