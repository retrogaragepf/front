"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function assertApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL no está definido. Configúralo en .env.local (dev) o en Vercel (prod).",
    );
  }
  return API_BASE_URL;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

async function fetchMyOrders() {
  const baseUrl = assertApiBaseUrl();
  const token = getAuthToken();

  const res = await fetch(`${baseUrl}/orders/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(
      (data as any)?.message || "No se pudieron cargar tus órdenes.",
    );
  }

  return data as any[];
}

export default function SuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    showToast.success("¡Pago aprobado! Estamos registrando tu orden.", {
      duration: 1800,
    });

    let cancelled = false;

    const waitForOrderThenRedirect = async () => {
      // Polling: hasta ~10s (10 intentos cada 1s)
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;

        try {
          const orders = await fetchMyOrders();
          if (Array.isArray(orders) && orders.length > 0) {
            // ✅ ya hay órdenes, redirigimos
            clearCart();
            router.push("/dashboard/orders");
            return;
          }
        } catch {
          // si falla, seguimos intentando (puede ser que el webhook aún no cree)
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      router.push("/dashboard/orders");
    };

    waitForOrderThenRedirect();

    return () => {
      cancelled = true;
    };
  }, [clearCart, router]);

  return (
    <div className="min-h-screen bg-amber-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-amber-100 border-2 border-amber-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="font-display text-2xl text-amber-900 font-extrabold mb-2">
          Pago Aprobado!!
        </h1>
        <p className="text-slate-800">
          Estamos cargando tus órdenes... espera unos segundos.
        </p>
      </div>
    </div>
  );
}
