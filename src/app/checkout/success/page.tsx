"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // JWT directo
  if (raw.startsWith("eyJ")) return raw;

  // JSON { token }
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

async function getMyOrdersCount(): Promise<number> {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}/orders/me`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => []);
  if (!res.ok)
    throw new Error(data?.message || "No se pudieron cargar órdenes.");

  return Array.isArray(data) ? data.length : 0;
}

export default function SuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      showToast.success("¡Pago aprobado! Estamos registrando tu orden.", {
        duration: 1800,
      });

      // Guardamos cuántas órdenes había ANTES (para detectar que apareció una nueva)
      let before = 0;
      try {
        before = await getMyOrdersCount();
      } catch {
        // si falla igual seguimos intentando
      }

      // Espera hasta ~10s a que el webhook cree la orden
      for (let i = 0; i < 10; i++) {
        try {
          const now = await getMyOrdersCount();
          if (now > before) {
            // ✅ Orden creada => ahora sí limpiamos carrito
            clearCart();
            showToast.success("Orden confirmada ✅. Carrito limpiado.", {
              duration: 1400,
            });
            router.push("/dashboard/orders");
            return;
          }
        } catch {
          // seguimos intentando
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      // Si no detectamos cambio, igual redirigimos (pero NO limpies si no confirmaste)
      showToast.info(
        "Tu orden puede tardar unos segundos. Revisa en Órdenes.",
        {
          duration: 1800,
        },
      );
      router.push("/dashboard/orders");
    })();
  }, [clearCart, router]);

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-amber-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="font-display text-2xl text-amber-900 font-extrabold mb-2">
          Pago exitoso
        </h1>
        <p className="text-slate-800">
          Listo. Si tu orden no aparece de inmediato, espera unos segundos: el
          webhook la confirma.
        </p>
      </div>
    </div>
  );
}
