"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";

export default function MyProductsPanel() {
  const { dataUser, isLoadingUser, isAuth } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = dataUser?.user?.id ?? (dataUser as any)?.id ?? null;

  const load = () => {
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const allProducts = JSON.parse(
      localStorage.getItem("retrogarage_products") || "[]"
    );

    const myProducts = allProducts.filter(
      (p: any) => p.sellerId === userId
    );

    setProducts(myProducts);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoadingUser && isAuth) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, String(userId)]);

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
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-2xl border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden"
            >
              <div className="aspect-[4/3] bg-zinc-100">
                <img
                  src={p.images?.[0] ?? ""}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-extrabold text-zinc-900">
                  {p.title}
                </h3>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-amber-900">
                    ${Number(p.price).toLocaleString("es-AR")}
                  </span>
                  <span className="text-zinc-700">
                    Stock: {p.stock}
                  </span>
                </div>

                {/* 🔥 Badge de estado para demo */}
                <div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      p.status === "approved"
                        ? "bg-green-200 text-green-800"
                        : p.status === "pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
