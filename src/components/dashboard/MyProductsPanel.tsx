"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import * as ToastNotify from "nextjs-toast-notify";

type AnyProduct = any;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  try {
    return isJson && text ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

function normalizeProducts(payload: any): AnyProduct[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload.data,
    payload.products,
    payload.items,
    payload.results,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;

  const nested = payload.data?.products || payload.data?.items;
  if (Array.isArray(nested)) return nested;

  return [];
}

// ✅ Toast wrapper compatible con:
// - showToast.success/info/error(msg, options)
// - showToast(msg, "success"|"warning"|"error")
function notify(
  type: "success" | "info" | "warning" | "error",
  msg: string,
  options?: any,
) {
  const mod: any = ToastNotify as any;
  const showToastMaybe = mod?.showToast ?? mod?.default?.showToast;

  if (showToastMaybe && typeof showToastMaybe === "object") {
    const fn = showToastMaybe?.[type];
    if (typeof fn === "function") return fn(msg, options);
  }

  if (typeof showToastMaybe === "function") {
    const mappedType = type === "info" ? "success" : type;
    return showToastMaybe(msg, mappedType);
  }

  console.log(`[toast:${type}]`, msg);
}

// ✅ Extrae JWT real aunque localStorage guarde JSON { user, token }
function getAuthTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // JWT plano
  if (raw.includes(".") && raw.split(".").length === 3) return raw;

  // JSON { user, token }
  try {
    const obj = JSON.parse(raw);
    const t = obj?.token;
    if (typeof t === "string" && t.includes(".") && t.split(".").length === 3)
      return t;
  } catch {}

  return null;
}

function getOwnerId(p: any) {
  return (
    p?.user_id ??
    p?.userId ??
    p?.sellerId ??
    p?.seller?.id ??
    p?.seller?._id ??
    p?.ownerId ??
    p?.owner?.id ??
    p?.user?.id ??
    null
  );
}

// ✅ Normaliza producto (imgUrl -> image, price/stock numéricos, id seguro)
function normalizeProduct(p: any) {
  const id = String(p?.id ?? p?._id ?? p?.productId ?? "");

  const image =
    p?.imgUrl ??
    p?.image ??
    p?.imageUrl ??
    p?.thumbnail ??
    p?.images?.[0] ??
    p?.image_url ??
    "";

  const title = p?.title ?? p?.name ?? "Producto";

  const priceRaw = p?.price;
  const price =
    typeof priceRaw === "string" ? Number(priceRaw) : Number(priceRaw);

  const stockRaw = p?.stock ?? p?.quantity;
  const stock =
    typeof stockRaw === "string" ? Number(stockRaw) : Number(stockRaw);

  const status = p?.status ?? p?.state ?? "published";

  return {
    ...p,
    id,
    image,
    title,
    price: Number.isFinite(price) ? price : undefined,
    stock: Number.isFinite(stock) ? stock : undefined,
    status,
  };
}

export default function MyProductsPanel() {
  const { dataUser, isLoadingUser, isAuth } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    return (dataUser as any)?.user?.id ?? (dataUser as any)?.id ?? null;
  }, [dataUser]);

  // ✅ Token: primero del contexto, si no, del storage (por si el context no lo expone)
  const token = useMemo(() => {
    return (dataUser as any)?.token ?? getAuthTokenFromStorage();
  }, [dataUser]);

  const load = useCallback(async () => {
    if (!API_BASE_URL) {
      setProducts([]);
      setLoading(false);
      return;
    }

    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    // ✅ 1) Ruta correcta: my-products (protegida)
    try {
      const res = await fetch(`${API_BASE_URL}/products/my-products`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        // si no hay token o expiró
        if (res.status === 401 || res.status === 403) {
          setProducts([]);
          notify("warning", "Tu sesión expiró. Inicia sesión de nuevo.");
          setLoading(false);
          return;
        }

        const msg =
          typeof data === "string"
            ? data
            : data?.message
              ? Array.isArray(data.message)
                ? data.message.join(", ")
                : data.message
              : "No se pudieron cargar tus productos";

        notify("error", msg);
        setProducts([]);
        setLoading(false);
        return;
      }

      const list = normalizeProducts(data).map(normalizeProduct);
      setProducts(list);
      setLoading(false);
      return;
    } catch {
      // seguimos al fallback
    }

    // ✅ 2) Fallback: traer todos y filtrar por userId
    try {
      const res2 = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const data2 = await parseJsonSafe(res2);
      const list2 = normalizeProducts(data2);

      const mine = list2
        .filter((p: any) => String(getOwnerId(p) ?? "") === String(userId))
        .map(normalizeProduct);

      setProducts(mine);
      setLoading(false);
    } catch {
      setProducts([]);
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (!isLoadingUser && isAuth) load();
  }, [isLoadingUser, isAuth, load]);

  useEffect(() => {
    const onFocus = () => {
      if (!isLoadingUser && isAuth) load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isLoadingUser, isAuth, load]);

  if (isLoadingUser) return null;

  return (
    <section className="bg-amber-100 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-extrabold tracking-wide text-amber-900">
          Mis productos
        </h2>

        <div className="flex items-center gap-2">
          <Link
            href="/createProduct"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-100 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
          >
            + Publicar
          </Link>

          <Link
            href="/dashboard/my-products"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-100 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
          >
            Ver todos
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-zinc-700">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="mt-6 p-5 bg-amber-50 rounded-xl border-2 border-dashed border-amber-900">
          <p className="text-zinc-700 font-bold">
            Aún no tienes productos publicados.
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            Publica tu primer artículo retro y aparecerá aquí.
          </p>
          <Link
            href="/createProduct"
            className="mt-4 inline-block px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold"
          >
            Publicar producto
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {products.slice(0, 6).map((p: any) => {
            const image = p.image || "";
            const title = p.title || "Producto";
            const price = p.price;
            const stock = p.stock ?? "—";
            const status = String(p.status ?? "published");

            const statusKey = status.toLowerCase();
            const statusClass =
              statusKey === "approved"
                ? "bg-green-200 text-green-800"
                : statusKey === "pending"
                  ? "bg-yellow-200 text-yellow-800"
                  : statusKey === "rejected"
                    ? "bg-red-200 text-red-800"
                    : "bg-slate-200 text-slate-800";

            return (
              <article
                key={p.id || `${title}-${image}`}
                className="bg-amber-100 rounded-2xl border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-900 bg-zinc-100 shrink-0">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-zinc-900 truncate">
                    {title}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-extrabold text-amber-900">
                      $
                      {typeof price === "number"
                        ? price.toLocaleString("es-CO", {
                            minimumFractionDigits: 0,
                          })
                        : "—"}
                    </span>

                    <span className="text-zinc-700">Stock: {stock}</span>

                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

              
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
