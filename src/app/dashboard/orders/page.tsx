"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { getMyOrders, type OrderDTO } from "@/src/services/orders.services";

function formatMoney(value: any) {
  return Number(value || 0).toLocaleString("es-AR");
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function traducirEstado(status: string) {
  switch (status) {
    case "PAID":
      return "Pago confirmado";
    case "SHIPPED":
      return "Enviado";
    case "DELIVERED":
      return "Entregado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "PAID":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "SHIPPED":
      return "bg-sky-100 text-sky-900 border-sky-300";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "CANCELLED":
      return "bg-rose-100 text-rose-900 border-rose-300";
    default:
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const load = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch {
      showToast.error("Error cargando órdenes");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (orderId: string) => {
    try {
      const authRaw = localStorage.getItem("retrogarage_auth");
      const { token } = JSON.parse(authRaw || "{}");

      // 🔥 optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "DELIVERED" } : o
        )
      );

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/ventas/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "DELIVERED" }),
        }
      );

      showToast.success("Orden marcada como recibida");
    } catch {
      showToast.error("Backend no respondió, actualizado localmente");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
        <h1 className="text-4xl font-black">Mis Compras</h1>

        {loading && <p>Cargando órdenes...</p>}

        {!loading && sorted.length === 0 && (
          <p>No realizaste compras todavía.</p>
        )}

        <div className="space-y-6">
          {sorted.map((o) => (
            <div
              key={o.id}
              className="border-2 border-zinc-900 bg-amber-200 p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-black hover:underline"
                    >
                      Orden #{o.id.slice(0, 8)}
                    </Link>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${statusBadge(
                        o.status
                      )}`}
                    >
                      {traducirEstado(o.status)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-700">
                    Compra realizada el{" "}
                    <span className="font-semibold">
                      {formatDate(o.createdAt)}
                    </span>
                  </p>

                  {o.items?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {o.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={item.product?.imgUrl}
                            alt={item.title}
                            className="w-14 h-14 object-cover border-2 border-zinc-900 rounded-lg"
                          />
                          <div>
                            <p className="font-semibold">
                              {item.title}
                            </p>
                            <p className="text-xs text-zinc-600">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-zinc-700">Total</p>
                  <p className="text-2xl font-black">
                    ${formatMoney(o.total)}
                  </p>

                  {o.status === "SHIPPED" && (
                    <button
                      onClick={() => handleReceive(o.id)}
                      className="mt-4 px-4 py-2 bg-emerald-300 border-2 border-zinc-900 rounded-xl hover:bg-emerald-400"
                    >
                      Marcar como recibido
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
