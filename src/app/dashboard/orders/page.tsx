"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { showToast } from "nextjs-toast-notify";
import { getMyOrders, type OrderDTO } from "@/src/services/orders.services";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";

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
  switch (status?.toUpperCase()) {
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
  switch (status?.toUpperCase()) {
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

function getDisplayStatus(o: OrderDTO) {
  if (!o.items || o.items.length === 0) {
    return o.status?.toUpperCase() || "";
  }

  const statuses = o.items
    .map((it) => it.status?.toUpperCase())
    .filter(Boolean);

  if (statuses.length === 0) {
    return o.status?.toUpperCase() || "";
  }

  if (statuses.every((s) => s === "DELIVERED")) return "DELIVERED";
  if (statuses.every((s) => s === "SHIPPED")) return "SHIPPED";
  if (statuses.every((s) => s === "CANCELLED")) return "CANCELLED";

  return o.status?.toUpperCase() || "";
}

/** ✅ NUEVO: helpers tolerantes (no rompen nada) */
function getFirstItem(o: OrderDTO): any | null {
  const items = (o as any)?.items;
  return Array.isArray(items) && items.length ? items[0] : null;
}

function getItemThumb(it: any): string {
  const url =
    it?.imgUrl ??
    it?.imageUrl ??
    it?.product?.imgUrl ??
    it?.product?.imageUrl ??
    it?.product?.image ??
    "";
  return typeof url === "string" ? url : "";
}

function getItemTitle(it: any): string {
  const t = it?.title ?? it?.product?.title ?? it?.product?.name ?? "";
  return typeof t === "string" ? t : "";
}

function getSellerEmail(it: any): string {
  // si el backend lo manda anidado
  const e =
    it?.product?.user?.email ??
    it?.product?.seller?.email ??
    it?.seller?.email ??
    "";
  return typeof e === "string" ? e : "";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { dataUser, isLoadingUser, isAuth } = useAuth();

  const sorted = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders]);

  const load = async (opts?: { silent?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
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

  const markAsReceived = async (orderId: string) => {
    try {
      if (!dataUser?.token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/orders/${orderId}/receive`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${dataUser.token}`,
          },
        },
      );

      if (!res.ok) {
        showToast.error("Error actualizando estado.");
        return;
      }

      showToast.success("Orden marcada como recibida.");
      load({ silent: true });
    } catch (error) {
      console.error(error);
      showToast.error("Error actualizando estado.");
    }
  };

  useEffect(() => {
    if (isLoadingUser) return;

    if (!isAuth) {
      setLoading(false);
      setError("No hay sesión activa. Inicia sesión para ver tus órdenes.");
      setOrders([]);
      return;
    }

    load();
  }, [isLoadingUser, isAuth, dataUser?.token]);

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
              Mis Compras
            </h1>
            <p className="text-zinc-700 mt-2">
              Aquí ves tus compras, estado y detalle de productos.
            </p>
          </div>

          <button
            onClick={() => load()}
            className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
          >
            Atrás
          </button>
        </div>

        {loading && <p className="mt-6">Cargando órdenes...</p>}
        {!loading && error && <p className="mt-6 text-rose-600">{error}</p>}
        {!loading && !error && sorted.length === 0 && (
          <p className="mt-6">No realizaste compras todavía.</p>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="mt-8 space-y-6">
            {sorted.map((o) => {
              const displayStatus = getDisplayStatus(o);

              // ✅ NUEVO: preview (1er item)
              const firstItem = getFirstItem(o);
              const productTitle = firstItem ? getItemTitle(firstItem) : "";
              const thumb = firstItem ? getItemThumb(firstItem) : "";
              const sellerEmail = firstItem ? getSellerEmail(firstItem) : "";

              return (
                <div
                  key={o.id}
                  className="rounded-2xl border-2 border-zinc-900 bg-amber-200 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
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
                          className={`px-3 py-1 text-xs font-bold rounded-full border ${statusBadge(
                            displayStatus,
                          )}`}
                        >
                          {traducirEstado(displayStatus)}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-700 mt-2">
                        Compra realizada el{" "}
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

                      {/* ✅ NUEVO: Producto + vendedor + miniatura */}
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-zinc-900/25 bg-white/60 p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-900/20 bg-white">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={productTitle || "Producto"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center text-[10px] text-zinc-500">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {productTitle || "Producto"}
                          </p>

                          {/* <p className="text-xs text-zinc-700 mt-1">
                            <span className="font-semibold">Vendedor:</span>{" "}
                            {sellerEmail ? (
                              <span className="break-all">{sellerEmail}</span>
                            ) : (
                              <span style={{ opacity: 0.7 }}>—</span>
                            )}
                          </p> */}

                          {Array.isArray((o as any)?.items) &&
                          (o as any).items.length > 1 ? (
                            <p className="text-[11px] text-zinc-600 mt-1">
                              + {(o as any).items.length - 1} producto(s) más
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-zinc-700">Total</p>
                      <p className="text-2xl font-black text-zinc-900">
                        ${formatMoney(o.total)}
                      </p>

                      <div className="mt-3">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
                        >
                          Ver detalle
                        </Link>
                      </div>

                      {displayStatus === "SHIPPED" && (
                        <div className="mt-3">
                          <button
                            onClick={() => markAsReceived(o.id)}
                            className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-emerald-300 hover:bg-emerald-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
                          >
                            Marcar como recibido
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
