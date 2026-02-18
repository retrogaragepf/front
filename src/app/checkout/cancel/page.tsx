"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-amber-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="font-display text-2xl text-amber-900 font-extrabold mb-2">
          Pago cancelado
        </h1>
        <p className="text-slate-800 mb-4">
          No se realizó el cobro. Puedes intentarlo otra vez.
        </p>
        <Link
          href="/cart"
          className="inline-block border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 px-4 py-2 font-display uppercase tracking-tight"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
