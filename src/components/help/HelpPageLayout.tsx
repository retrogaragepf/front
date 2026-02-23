import Link from "next/link";
import { ReactNode } from "react";

type HelpPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function HelpPageLayout({
  title,
  description,
  children,
}: HelpPageLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-amber-100 text-zinc-900">
      <section className="relative overflow-hidden border-b border-amber-300/60">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          }}
        />
        <div className="pointer-events-none absolute -top-20 -right-24 w-80 h-80 rounded-full bg-emerald-800/15" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-amber-800/10" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-display inline-block px-3 py-1 bg-amber-800 text-amber-50 uppercase tracking-widest text-xs -rotate-2">
                Centro de Ayuda
              </span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-handwritten text-black">
                {title}
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed font-handwritten text-black/80">
                {description}
              </p>
            </div>

            <Link
              href="/"
              className="font-handwritten inline-flex items-center justify-center rounded-xl border-2 border-emerald-950 bg-emerald-900 px-5 py-3 text-sm font-semibold text-amber-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition hover:-translate-y-px hover:bg-amber-800"
            >
              Volver al inicio
            </Link>
          </header>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {children}
      </main>
    </div>
  );
}
