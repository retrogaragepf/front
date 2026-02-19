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

type AnyOrder = { id?: string; createdAt?: string; [k: string]: any };

async function fetchMyOrders(): Promise<AnyOrder[]> {
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

  // si el back responde { orders: [...] }
  if (Array.isArray((data as any)?.orders)) return (data as any).orders;
  return Array.isArray(data) ? (data as AnyOrder[]) : [];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function SuccessPage() {
  const router = useRouter();
  const { clearCart, cartItems } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    showToast.success("¡Pago aprobado! Estamos registrando tu orden.", {
      duration: 1800,
    });

    let cancelled = false;

    const waitForNewOrderThenRedirect = async () => {
      try {
        // 1) Snapshot inicial (para no confundir órdenes viejas con la nueva)
        const initial = await fetchMyOrders();
        const initialIds = new Set(
          initial.map((o) => String(o?.id ?? "")).filter(Boolean),
        );

        // 2) Polling: hasta ~15s (15 intentos cada 1s)
        for (let i = 0; i < 15; i++) {
          if (cancelled) return;

          try {
            const current = await fetchMyOrders();

            // busca una orden que NO estaba al inicio
            const newOrder = current.find((o) => {
              const id = String(o?.id ?? "");
              return id && !initialIds.has(id);
            });

            if (newOrder) {
              // ✅ Solo limpiamos carrito si realmente hubo compra (y el carrito tenía algo)
              if (cartItems.length > 0) clearCart();
              router.replace("/dashboard/orders");
              return;
            }
          } catch {
            // si falla, seguimos intentando (webhook aún puede estar procesando)
          }

          await sleep(1000);
        }
      } catch {
        // si falló el snapshot inicial, igual hacemos polling “simple”
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          try {
            const orders = await fetchMyOrders();
            if (Array.isArray(orders) && orders.length > 0) {
              if (cartItems.length > 0) clearCart();
              router.replace("/dashboard/orders");
              return;
            }
          } catch {}
          await sleep(1000);
        }
      }

      // fallback: redirige sin limpiar (por seguridad)
      router.replace("/dashboard/orders");
    };

    waitForNewOrderThenRedirect();

    return () => {
      cancelled = true;
    };
    // Ojo: cartItems aquí es para validar si limpiar; no lo metas como dep fuerte si te re-ejecuta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCart, router]);

  return (
    <div className="min-h-screen bg-amber-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-amber-100 border-2 border-amber-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="font-display text-2xl text-amber-900 font-extrabold mb-2">
          ¡Pago aprobado!
        </h1>
        <p className="text-slate-800">
          Estamos cargando tus órdenes... espera unos segundos.
        </p>
      </div>
    </div>
  );
}
