"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";

type AnyProduct = any;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "auth_token";

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

  // Formatos comunes
  const candidates = [
    payload.data,
    payload.products,
    payload.items,
    payload.results,
  ];
  for (const c of candidates) if (Array.isArray(c)) return c;

  // A veces: { data: { products: [] } }
  const nested = payload.data?.products || payload.data?.items;
  if (Array.isArray(nested)) return nested;

  return [];
}

function getSellerId(p: any) {
  return (
    p?.sellerId ??
    p?.seller?.id ??
    p?.seller?._id ??
    p?.userId ??
    p?.user?.id ??
    p?.ownerId ??
    p?.owner?.id ??
    null
  );
}

export default function MyProductsPanel() {
  const { dataUser, isLoadingUser, isAuth } = useAuth();

  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    return dataUser?.user?.id ?? (dataUser as any)?.id ?? null;
  }, [dataUser]);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const load = useCallback(async () => {
    if (!API_BASE_URL || !userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    // ✅ 1) Intento “por usuario” (tu ruta)
    try {
      const res1 = await fetch(
        `${API_BASE_URL}/products/${encodeURIComponent(String(userId))}`,
        { method: "GET", headers, cache: "no-store" },
      );
      const data1 = await parseJsonSafe(res1);

      const list1 = normalizeProducts(data1);

      // Si devuelve lista, filtramos por sellerId para estar seguros
      if (res1.ok && list1.length) {
        const mine = list1.filter(
          (p: any) => String(getSellerId(p) ?? "") === String(userId),
        );
        setProducts(mine.length ? mine : list1);
        setLoading(false);
        return;
      }
    } catch {
      // seguimos al fallback
    }

    // ✅ 2) FALLBACK “a la fija”: traer todos y filtrar por usuario
    try {
      const res2 = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      const data2 = await parseJsonSafe(res2);

      const list2 = normalizeProducts(data2);

      const mine = list2.filter(
        (p: any) => String(getSellerId(p) ?? "") === String(userId),
      );

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
    <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-extrabold tracking-wide text-amber-900">
          Mis productos
        </h2>

        <div className="flex items-center gap-2">
          <Link
            href="/createProduct"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
          >
            + Publicar
          </Link>

          <Link
            href="/dashboard/my-products"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
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
          {products.slice(0, 6).map((p) => {
            const image = p.images?.[0] ?? p.image ?? p.thumbnail ?? "";
            const title = p.title ?? p.name ?? "Producto";
            const price = Number(p.price ?? 0);
            const stock = p.stock ?? p.quantity ?? 0;
            const status = p.status ?? p.state ?? "published";

            return (
              <article
                key={p.id ?? p._id ?? `${title}-${image}`}
                className="bg-white rounded-2xl border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-900 bg-zinc-100 shrink-0">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-zinc-900 truncate">
                    {title}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-extrabold text-amber-900">
                      $
                      {Number.isFinite(price)
                        ? price.toLocaleString("es-AR")
                        : String(p.price)}
                    </span>
                    <span className="text-zinc-700">Stock: {stock}</span>

                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${
                        String(status).toLowerCase() === "approved"
                          ? "bg-green-200 text-green-800"
                          : String(status).toLowerCase() === "pending"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                      }`}
                    >
                      {String(status)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/my-products"
                  className="px-3 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shrink-0"
                >
                  Gestionar
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
