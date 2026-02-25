"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";

export default function SuccessClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { clearCart } = useCart();

  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const sessionId = params.get("session_id");

    showToast.success("¡Pago aprobado! Redirigiendo a tus órdenes…", {
      duration: 2500,
    });

    try {
      Promise.resolve(clearCart()).catch(() => {});
    } catch {}

    setTimeout(() => {
      router.replace("/dashboard/orders");
      router.refresh();
    }, 1600);

    void sessionId;
  }, [params, router, clearCart]);

  return (
    <div className="min-h-screen bg-amber-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="text-2xl font-black text-zinc-900">Pago aprobado ✅</h1>
        <p className="text-zinc-700 mt-2">
          Estamos preparando tu orden y redirigiéndote a <b>Mis Órdenes</b>.
        </p>

        <p className="text-zinc-500 mt-4 text-sm">
          Si no te redirige automáticamente:
        </p>

        <button
          onClick={() => router.replace("/dashboard/orders")}
          className="mt-3 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-200 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
        >
          Ir a Mis Órdenes
        </button>
      </div>
    </div>
  );
}
