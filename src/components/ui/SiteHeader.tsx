"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/musee", label: "Musée" },
  { href: "/quiz", label: "Quiz" },
  { href: "/a-propos", label: "À propos" },
];

/**
 * The one piece of chrome every page shares. It is what makes the landing, the
 * museum and the quiz read as one site rather than three — same wordmark, same
 * hairline, same uppercase nav, same accent on the current section.
 *
 * `/musee` opts out (`variant="bare"` is not used there at all): its entrance is
 * a full-bleed split with its own chrome, and a header on top would eat the
 * photo panel.
 */
export function SiteHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <header
      // h-16 is load-bearing: the model page sizes its 3D column with
      // `calc(100dvh - 4rem)` and assumes exactly this header height.
      className={`flex h-16 shrink-0 items-center justify-between gap-6 border-b border-rule px-6 md:px-10 ${className}`}
    >
      {/* Tracking is what blows this up on a 430px screen — the wordmark and the
          three nav items each wrap onto two lines. Tighten it below md. */}
      <Link
        href="/"
        className="whitespace-nowrap text-[0.6rem] uppercase tracking-[0.2em] text-foreground transition hover:text-accent md:text-[0.7rem] md:tracking-[0.4em]"
      >
        Guess the Model
      </Link>

      <nav>
        <ul className="flex items-center gap-4 md:gap-8">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap text-[0.6rem] uppercase tracking-[0.15em] transition md:text-[0.7rem] md:tracking-[0.25em] ${
                    active
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
