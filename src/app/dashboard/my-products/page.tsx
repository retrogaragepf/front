"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import Link from "next/link";

export default function MyProductsPage() {
  const { dataUser, isAuth, isLoadingUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = dataUser?.user?.id ?? null;

  const load = () => {
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
  }, [isLoadingUser, isAuth, userId]);

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
          href="/createProduct"
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

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">
                    ${Number(p.price).toLocaleString("es-AR")}
                  </span>
                  <span className="text-zinc-600">Stock: {p.stock}</span>
                </div>

                {/* 🔥 ESTADO VISUAL PARA LA DEMO */}
                <div className="mt-2">
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
        </section>
      )}
    </main>
  );
}
