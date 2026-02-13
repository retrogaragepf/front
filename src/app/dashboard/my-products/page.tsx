"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";

export default function Page() {
  const { dataUser, isAuth, isLoadingUser } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ compatible con tus dos formas (por si cambia el shape)
  const userId =
    dataUser?.user?.id ??
    (dataUser as any)?.id ??
    (dataUser as any)?.userId ??
    null;

  const load = () => {
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const allProducts = JSON.parse(
      localStorage.getItem("retrogarage_products") || "[]",
    );

    const myProducts = allProducts.filter((p: any) => p.sellerId === userId);

    setProducts(myProducts);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoadingUser && isAuth) {
      load();
    } else if (!isLoadingUser && !isAuth) {
      setLoading(false);
      setProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, String(userId)]);

  // ✅ refresca al volver a la pestaña (por si publicas y vuelves)
  useEffect(() => {
    const onFocus = () => {
      if (!isLoadingUser && isAuth) load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, String(userId)]);

  const count = useMemo(() => products.length, [products]);

  if (isLoadingUser) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  if (!isAuth) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] space-y-4">
          <h1 className="text-2xl font-extrabold text-amber-900">
            Mis productos
          </h1>
          <p className="text-zinc-700 font-bold">
            Debes iniciar sesión para ver tus productos.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
          >
            Ir a Login
          </Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <p className="text-zinc-700">Cargando productos...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <section className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-amber-900">
              Mis productos
            </h1>
            <p className="mt-1 text-sm text-zinc-700">
              Total:{" "}
              <span className="font-extrabold text-amber-900">{count}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:bg-amber-50 transition"
            >
              ← Volver
            </Link>

            <Link
              href="/createProduct"
              className="px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-200 text-amber-900 font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:bg-amber-100 transition"
            >
              + Publicar producto
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
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
            {products.map((p) => (
              <article
                key={p.id}
                className="bg-white rounded-2xl border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] p-4 flex items-center gap-4"
              >
                {/* ✅ thumb pequeño */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-900 bg-zinc-100 shrink-0">
                  <img
                    src={p.images?.[0] ?? ""}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* ✅ info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-extrabold text-zinc-900 truncate">
                    {p.title}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-extrabold text-amber-900">
                      ${Number(p.price).toLocaleString("es-AR")}
                    </span>

                    <span className="text-zinc-700">Stock: {p.stock}</span>

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

                {/* ✅ acciones demo */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/product/${p.id}`}
                    className="px-3 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold hover:bg-amber-50 transition"
                  >
                    Ver
                  </Link>

                  {/* Si aún no tienes edición, lo dejo apuntando a createProduct */}
                 
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
