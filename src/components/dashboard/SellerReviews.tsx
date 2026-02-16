"use client";

import React, { useMemo, useState } from "react";

type Review = {
  id: string;
  buyerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  date: string; // "2026-02-06"
  product: string;
  badge?: "Envío rápido" | "Excelente estado" | "Buen empaque" | "Recomendado";
  verified?: boolean;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    buyerName: "Camila R.",
    rating: 5,
    title: "Impecable, tal cual la foto",
    comment:
      "Llegó súper rápido y el producto estaba en excelente estado. Vendedor muy atento y respondió al momento.",
    date: "2026-02-04",
    product: "Walkman Sony (Vintage)",
    badge: "Excelente estado",
    verified: true,
  },
  {
    id: "r2",
    buyerName: "Juan S.",
    rating: 5,
    title: "Empaque top",
    comment:
      "Venía muy bien protegido, cero golpes. Se nota el cuidado. Volvería a comprar sin dudar.",
    date: "2026-02-01",
    product: "Radio Retro AM/FM",
    badge: "Buen empaque",
    verified: true,
  },
  {
    id: "r3",
    buyerName: "Laura M.",
    rating: 4,
    title: "Muy buena experiencia",
    comment:
      "Todo bien, solo que el mensajero se demoró un poco. El vendedor estuvo pendiente y me avisó.",
    date: "2026-01-29",
    product: "Cámara Análoga 35mm",
    badge: "Recomendado",
    verified: true,
  },
  {
    id: "r4",
    buyerName: "Andrés P.",
    rating: 5,
    title: "Envío express",
    comment:
      "De un día para otro ya lo tenía. Excelente comunicación y muy serio.",
    date: "2026-01-22",
    product: "Chaqueta Vintage",
    badge: "Envío rápido",
    verified: true,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Calificación: ${rating} de 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-amber-900" : "text-amber-900/25"}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-[10px] font-extrabold tracking-widest uppercase text-zinc-600">
        {rating}.0
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m}/${y}`;
}

export default function SellerReviews() {
  const [filter, setFilter] = useState<"all" | "5" | "4+">("all");

  const filtered = useMemo(() => {
    if (filter === "5") return MOCK_REVIEWS.filter((r) => r.rating === 5);
    if (filter === "4+") return MOCK_REVIEWS.filter((r) => r.rating >= 4);
    return MOCK_REVIEWS;
  }, [filter]);

  const summary = useMemo(() => {
    const total = MOCK_REVIEWS.length;
    const avg =
      total === 0
        ? 0
        : MOCK_REVIEWS.reduce((acc, r) => acc + r.rating, 0) / total;

    const five = MOCK_REVIEWS.filter((r) => r.rating === 5).length;

    return { total, avg: Number(avg.toFixed(1)), five };
  }, []);

  return (
    <section
      className="
        rounded-2xl
        border-2 border-amber-900
        bg-amber-50
        shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold tracking-wide text-amber-900">
              Reseñas como vendedor
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              <span className="font-extrabold text-amber-900">
                {summary.avg}/5
              </span>{" "}
              promedio ·{" "}
              <span className="font-extrabold text-amber-900">
                {summary.five}
              </span>{" "}
              reseñas de 5★ ·{" "}
              <span className="font-extrabold text-amber-900">
                {summary.total}
              </span>{" "}
              en total
            </p>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-950 bg-emerald-900 text-amber-50 text-[10px] font-extrabold tracking-widest uppercase">
            Vendedor top
          </span>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todas" },
            { key: "5", label: "Solo 5★" },
            { key: "4+", label: "4★ o más" },
          ].map((b) => (
            <button
              key={b.key}
              onClick={() => setFilter(b.key as any)}
              className={`
                px-3 py-2 rounded-xl border-2 text-xs font-extrabold tracking-widest uppercase transition
                ${
                  filter === b.key
                    ? "border-emerald-950 bg-emerald-900 text-amber-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]"
                    : "border-amber-900 bg-amber-50 text-amber-900 hover:-translate-y-px shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]"
                }
              `}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-0.5 w-full bg-amber-300" />

      {/* List */}
      <ul className="p-6 space-y-4">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="
              rounded-2xl border-2 border-amber-900 bg-amber-100/40
              p-5
              shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-amber-900">
                    {r.buyerName}
                  </span>

                  {r.verified && (
                    <span className="text-[10px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-900">
                      Compra verificada
                    </span>
                  )}

                  {r.badge && (
                    <span className="text-[10px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-full border border-emerald-950 bg-emerald-900 text-amber-50">
                      {r.badge}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <Stars rating={r.rating} />
                </div>
              </div>

              <span className="text-xs font-extrabold tracking-widest uppercase text-zinc-600 shrink-0">
                {formatDate(r.date)}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-sm font-extrabold text-amber-900">{r.title}</p>
              <p className="mt-2 text-sm text-zinc-700 leading-relaxed">
                {r.comment}
              </p>

              <div className="mt-4 h-0.5 w-full bg-amber-300" />

              <p className="mt-3 text-xs font-extrabold tracking-widest uppercase text-zinc-700">
                Producto: <span className="text-amber-900">{r.product}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer accent */}
      <div className="h-2 bg-emerald-900" />
    </section>
  );
}
