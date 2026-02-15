"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const LAST_ORDER_KEY = "retrogarage_last_order";
const CHECKOUT_MODE = (
  process.env.NEXT_PUBLIC_CHECKOUT_MODE || "mock"
).toLowerCase(); // mock | stripe

export default function SuccessPage() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {
        setOrder(null);
      }
    }
  }, []);

  const totalFormatted = useMemo(() => {
    if (!order?.totalPrice) return "";
    const n = Number(order.totalPrice);
    return Number.isFinite(n)
      ? n.toLocaleString("es-CO", { minimumFractionDigits: 0 })
      : "";
  }, [order]);

  const subtitle = order
    ? "(Simulación tipo Stripe - MOCK)"
    : CHECKOUT_MODE === "stripe"
      ? "(Stripe Checkout - TEST)"
      : "(Checkout completado)";

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl">✅ Pago exitoso</h1>
      <p className="mt-2 text-zinc-700 italic">{subtitle}</p>

      {/* ✅ Caso MOCK: muestra detalles de “orden” */}
      {order ? (
        <div className="mt-6 p-6 bg-white rounded-xl border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 italic">Orden</span>
            <span className="font-bold">{order.id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 italic">Estado</span>
            <span className="font-bold">{order.status}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 italic">Total</span>
            <span className="font-bold text-xl">${totalFormatted}</span>
          </div>

          <div className="pt-2 text-sm text-zinc-700 italic opacity-80">
            Pasarela: {order.provider}
          </div>
        </div>
      ) : (
        /* ✅ Caso Stripe: fallback bonito */
        <div className="mt-6 p-6 bg-white rounded-xl border shadow-sm space-y-3">
          <p className="text-zinc-800">Tu pago se completó correctamente.</p>
          <p className="text-sm text-zinc-700 italic opacity-80">
            En producción, RetroGarage confirmaría el pago con un webhook de
            Stripe y crearía la orden en la base de datos.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/product"
          className="w-full sm:w-auto text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-amber-400 hover:bg-amber-300 transition"
        >
          Seguir comprando
        </Link>

        <Link
          href="/cart"
          className="w-full sm:w-auto text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-white hover:bg-amber-100 transition"
        >
          Volver al carrito
        </Link>
      </div>
    </main>
  );
}
