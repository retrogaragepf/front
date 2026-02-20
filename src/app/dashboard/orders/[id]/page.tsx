"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import {
  getOrderById,
  type OrderDTO,
  type OrderItemDTO,
} from "@/src/services/orders.services";

function formatCOP(value: number) {
  return (value || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 });
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const orderId = params?.id;

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo<OrderItemDTO[]>(
    () => (order?.items?.length ? order.items : []),
    [order],
  );

  const itemsTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  }, [items]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!orderId) throw new Error("No se encontró el id en la URL.");
      const data = await getOrderById(String(orderId));
      setOrder(data);
    } catch (e: any) {
      const msg = e?.message || "Error cargando la orden.";
      setError(msg);
      showToast.error(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
              Detalle de Orden
            </h1>
            <p className="text-zinc-700 mt-2">
              <span className="font-semibold">ID:</span>{" "}
              <span className="font-mono">{orderId}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/orders"
              className="px-4 py-2 rounded-xl border-2 border-zinc-900 bg-white hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
            >
              Volver
            </Link>
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-200 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
            >
              Refrescar
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-zinc-800 font-semibold">Cargando orden…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border-2 border-rose-900 bg-rose-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-rose-900 font-bold">No se pudo cargar.</p>
            <p className="text-rose-900/80 mt-2">{error}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="px-4 py-2 rounded-xl border-2 border-zinc-900 bg-white hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
              >
                Ir a Mis Órdenes
              </button>
              <button
                onClick={load}
                className="px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-200 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && order && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-zinc-900 font-black">
                      Orden{" "}
                      <span className="font-mono text-sm md:text-base">
                        #{order.id.slice(0, 8)}
                      </span>
                    </p>

                    <span
                      className={`px-3 py-1 rounded-full border text-xs font-bold ${statusBadgeClass(
                        order.status,
                      )}`}
                    >
                      {String(order.status).toUpperCase()}
                    </span>
                  </div>

                  <p className="text-zinc-700 mt-2">
                    Creada:{" "}
                    <span className="font-semibold">
                      {formatDate(order.createdAt)}
                    </span>
                  </p>

                  {order.updatedAt ? (
                    <p className="text-zinc-700 mt-1">
                      Actualizada:{" "}
                      <span className="font-semibold">
                        {formatDate(order.updatedAt)}
                      </span>
                    </p>
                  ) : null}

                  {order.trackingCode ? (
                    <p className="text-zinc-700 mt-1">
                      Tracking:{" "}
                      <span className="font-mono font-semibold">
                        {order.trackingCode}
                      </span>
                    </p>
                  ) : (
                    <p className="text-zinc-500 mt-1 text-sm">
                      Tracking aún no asignado.
                    </p>
                  )}

                  {order.stripePaymentIntentId ? (
                    <p className="text-zinc-500 text-xs mt-2 font-mono">
                      payment_intent: {order.stripePaymentIntentId.slice(0, 18)}
                      …
                    </p>
                  ) : null}
                </div>

                <div className="text-left md:text-right">
                  <p className="text-zinc-700">Total de la orden</p>
                  <p className="text-3xl font-black text-zinc-900">
                    ${formatCOP(order.total)}
                  </p>
                  {items.length ? (
                    <p className="text-zinc-600 text-sm mt-1">
                      Suma items: ${formatCOP(itemsTotal)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-zinc-900 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
              <p className="font-black text-zinc-900 mb-4 text-xl">Items</p>

              {items.length ? (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-zinc-900/20 bg-white/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">
                          {it.title || it.product?.title || "Producto"}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {it.quantity} × ${formatCOP(it.unitPrice)}
                        </p>
                        {it.product?.id ? (
                          <p className="text-xs text-zinc-500 font-mono mt-1">
                            product: {it.product.id.slice(0, 10)}…
                          </p>
                        ) : null}
                      </div>

                      <p className="font-black text-zinc-900">
                        ${formatCOP(it.subtotal)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-600">
                  Esta orden no trae items en la respuesta (o vienen en otro
                  campo). Revisa el back.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
