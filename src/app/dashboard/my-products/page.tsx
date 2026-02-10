"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import {
  mockEnsureUserStore,
  mockGetMyProductsSafe,
} from "@/src/services/products.user.mock.service";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import Link from "next/link";

export default function MyProductsPage() {
  const { dataUser, isAuth, isLoadingUser } = useAuth();
  const [products, setProducts] = useState<IProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = dataUser?.user?.id ?? null;
  const fullName = dataUser?.user?.name ?? "User";
  const email = dataUser?.user?.email ?? "user@retrogarage.com";

  const load = async () => {
    setLoading(true);

    // ✅ asegura el user en el store (aunque no tenga productos todavía)
    await mockEnsureUserStore({ userId, fullName, email });

    const res = await mockGetMyProductsSafe(userId);
    setProducts(res);

    setLoading(false);
  };

  useEffect(() => {
    if (!isLoadingUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(userId), isLoadingUser]);

  // ✅ refresca si vuelves a la pestaña (ideal para demo)
  useEffect(() => {
    const onFocus = () => {
      if (!isLoadingUser && isAuth) load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, String(userId)]);

  if (isLoadingUser) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  if (!isAuth) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Mis productos</h1>
        <p className="text-zinc-700">
          Debes iniciar sesión para ver tus productos.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-lg border-2 border-slate-900 bg-amber-400 font-bold"
        >
          Ir a Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Mis productos</h1>

        <Link
          href="/create-product"
          className="px-4 py-2 rounded-lg border-2 border-slate-900 bg-amber-400 font-bold hover:bg-amber-300 transition"
        >
          + Publicar producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 p-6 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-zinc-700">Aún no tienes productos publicados.</p>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-xl border-2 border-slate-900 shadow-sm overflow-hidden"
            >
              <div className="aspect-[4/3] bg-zinc-100">
                <img
                  src={p.images?.[0] ?? ""}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4 space-y-2">
                <h2 className="font-bold text-lg">{p.title}</h2>
                <p className="text-sm text-zinc-600 line-clamp-2">
                  {p.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">
                    ${Number(p.price).toLocaleString("es-CO")}
                  </span>
                  <span className="text-zinc-600">Stock: {p.stock}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>{p.category?.name}</span>
                  <span>{p.era?.name}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
