import type { Metadata } from "next";
import { QUIZ_POOL, quizPoolCounts } from "@/content/quiz";
import { SiteHeader } from "@/components/ui/SiteHeader";
import QuizGame from "@/components/quiz/QuizGame";

export const metadata: Metadata = {
  title: "Quiz — Guess the Model",
  description:
    "Un gros plan, quatre réponses : reconnaissez la voiture avant que la photo ne se dézoome.",
};

// Server component: the catalogue stays on the server, only the slim quiz pool
// (one row per model) crosses into the client bundle.
export default function QuizPage() {
  return (
    <>
      {/* The reveal boots a Sketchfab viewer within seconds of the first
          question — get the connections out of the way now. */}
      <link rel="preconnect" href="https://sketchfab.com" />
      <link rel="preconnect" href="https://static.sketchfab.com" />
      <link rel="preconnect" href="https://media.sketchfab.com" crossOrigin="" />
      <main className="flex min-h-dvh flex-col">
        <SiteHeader />
        <QuizGame pool={QUIZ_POOL} counts={quizPoolCounts()} />
      </main>
    </>
  );
}
