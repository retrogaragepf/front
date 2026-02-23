"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { getMyOrders, type OrderDTO } from "@/src/services/orders.services";
import { useAuth } from "@/src/context/AuthContext";

function formatCOP(value: any) {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (["paid", "approved"].includes(s))
    return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (["pending"].includes(s))
    return "bg-amber-100 text-amber-900 border-amber-300";
  if (["cancelled", "refunded"].includes(s))
    return "bg-rose-100 text-rose-900 border-rose-300";
  if (["shipped", "delivered", "processing"].includes(s))
    return "bg-sky-100 text-sky-900 border-sky-300";
  return "bg-zinc-100 text-zinc-900 border-zinc-300";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Auth desde contexto (token en memoria)
  const { dataUser, isLoadingUser, isAuth } = useAuth();

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });
  }, [orders]);

  // ✅ Silent toast opcional para refrescos automáticos (pageshow/visibilitychange)
  const load = async (opts?: { silent?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Usa token desde AuthContext para evitar race con localStorage
      const data = await getMyOrders(dataUser?.token ?? undefined);
      setOrders(data);
    } catch (e: any) {
      const msg = e?.message || "Error cargando órdenes.";
      setError(msg);
      setOrders([]);
      if (!opts?.silent) showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Carga principal SIN doble carga: espera hidratación de auth
  useEffect(() => {
    if (isLoadingUser) return;

    if (!isAuth) {
      setLoading(false);
      setError("No hay sesión activa. Inicia sesión para ver tus órdenes.");
      setOrders([]);
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, dataUser?.token]);

  // ✅ Rehidratar al volver con atrás/adelante (bfcache) y al volver a la pestaña
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !isLoadingUser && isAuth) {
        load({ silent: true });
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !isLoadingUser && isAuth) {
        load({ silent: true });
      }
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, dataUser?.token]);

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
              Mis Órdenes
            </h1>
            <p className="text-zinc-700 mt-2">
              Aquí ves tus compras, estado y detalle de productos.
            </p>
          </div>

          <button
            onClick={() => load()}
            className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-zinc-800 font-semibold">Cargando órdenes…</p>
            <p className="text-zinc-600 mt-1">
              Si no hay token o el back está caído, verás el error aquí.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border-2 border-rose-900 bg-rose-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-rose-900 font-bold">No se pudieron cargar.</p>
            <p className="text-rose-900/80 mt-2">{error}</p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-zinc-900 font-bold">Aún no tienes órdenes.</p>
            <p className="text-zinc-700 mt-2">
              Ve a productos y haz tu primera compra.
            </p>
            <div className="mt-4">
              <Link
                href="/product"
                className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-200 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
              >
                Ir a productos
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="mt-8 space-y-6">
            {sorted.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border-2 border-zinc-900 bg-amber-200 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="text-zinc-900 font-black hover:underline"
                      >
                        Orden{" "}
                        <span className="font-mono text-sm md:text-base">
                          #{o.id.slice(0, 8)}
                        </span>
                      </Link>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-bold ${statusBadgeClass(
                          o.status,
                        )}`}
                      >
                        {String(o.status).toUpperCase()}
                      </span>
                    </div>

                    <p className="text-zinc-700 mt-2">
                      Creada:{" "}
                      <span className="font-semibold">
                        {formatDate(o.createdAt)}
                      </span>
                    </p>

                    {o.trackingCode ? (
                      <p className="text-zinc-700 mt-1">
                        Tracking:{" "}
                        <span className="font-mono font-semibold">
                          {o.trackingCode}
                        </span>
                      </p>
                    ) : (
                      <p className="text-zinc-500 mt-1 text-sm">
                        Tracking aún no asignado.
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-zinc-700">Total</p>
                    <p className="text-2xl font-black text-zinc-900">
                      ${formatCOP(o.total)}
                    </p>

                    <div className="mt-3">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-zinc-900/20 pt-5">
                  <p className="font-bold text-zinc-900 mb-3">Items</p>

                  {o.items?.length ? (
                    <ul className="space-y-3">
                      {o.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-zinc-900/20 bg-amber-100 p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 truncate">
                              {it.title || it.product?.title || "Producto"}
                            </p>
                            <p className="text-sm text-zinc-600">
                              {it.quantity} × ${formatCOP(it.unitPrice)}
                            </p>
                          </div>
                          <p className="font-black text-zinc-900">
                            ${formatCOP(it.subtotal)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-600">
                      Esta orden no trae items en la respuesta (revisa el back).
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
