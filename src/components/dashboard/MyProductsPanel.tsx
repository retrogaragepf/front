"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import {
  mockEnsureUserStore,
  mockGetMyProductsSafe,
} from "@/src/services/products.user.mock.service";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";

export default function MyProductsPanel() {
  const { dataUser, isLoadingUser, isAuth } = useAuth();
  const [products, setProducts] = useState<IProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = dataUser?.user?.id ?? (dataUser as any)?.id ?? null;
  const fullName = dataUser?.user?.name ?? (dataUser as any)?.name ?? "User";
  const email =
    dataUser?.user?.email ?? (dataUser as any)?.email ?? "user@retrogarage.com";

  const load = async () => {
    setLoading(true);
    await mockEnsureUserStore({ userId, fullName, email });
    const res = await mockGetMyProductsSafe(userId);
    setProducts(res);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoadingUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(userId), isLoadingUser]);

  useEffect(() => {
    const onFocus = () => {
      if (!isLoadingUser && isAuth) load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, String(userId)]);

  if (isLoadingUser) return null;

  return (
    <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-extrabold tracking-wide text-amber-900">
          Mis productos
        </h2>

        <div className="flex items-center gap-2">
          <Link
            href="/create-product"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
          >
            + Publicar
          </Link>

          <Link
            href="/dashboard/my-products"
            className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:bg-amber-50 transition"
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
            href="/create-product"
            className="mt-4 inline-block px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
          >
            Publicar producto
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-2xl border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden"
            >
              <div className="aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images?.[0] ?? ""}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-extrabold text-zinc-900">{p.title}</h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-amber-900">
                    ${Number(p.price).toLocaleString("es-CO")}
                  </span>
                  <span className="text-zinc-700">Stock: {p.stock}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-700">
                  <span>{p.category?.name}</span>
                  <span>{p.era?.name}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
