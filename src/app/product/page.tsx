"use client";

import React, { useEffect, useState } from "react";
import Card from "@/src/components/Card";
import { mockGetAllProducts } from "@/src/services/products.mock.service";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";

export default function ProductPage() {
  const [products, setProducts] = useState<IProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await mockGetAllProducts();
    setProducts(res);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ refresca al volver a la pestaña (ideal para demo)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (loading) {
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold">Productos</h1>

        <button
          onClick={load}
          className="px-4 py-2 rounded-lg border-2 border-slate-900 bg-amber-400 font-bold hover:bg-amber-300 transition"
        >
          Actualizar
        </button>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 p-6 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-zinc-700">
            Aún no hay productos publicados. Ve a “Vender” y crea el primero.
          </p>
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Card key={p.id} product={p} />
          ))}
        </section>
      )}
    </main>
  );
}