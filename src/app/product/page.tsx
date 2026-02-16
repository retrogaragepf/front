"use client";

import React, { useEffect, useState } from "react";
import Card from "@/src/components/Card";
import { getAllProducts } from "@/src/services/products.services";
import type { IProduct } from "@/src/interfaces/product.interface";

export default function ProductPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [ready, setReady] = useState(false); // solo para saber que ya intentamos cargar al menos 1 vez
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await getAllProducts();
      console.log("SAMPLE PRODUCT =>", res?.[0]);
      setProducts(res);
    } catch (err) {
      console.error("Error cargando productos:", err);
      // no rompas UI: deja lo que había; si no había nada, quedará vacío
      if (!ready) setProducts([]);
    } finally {
      setRefreshing(false);
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Si esto era lo que te molestaba, déjalo apagado:
  // (si lo quieres, lo activas pero igual ya NO muestra "Cargando...")
  // useEffect(() => {
  //   const onFocus = () => load();
  //   window.addEventListener("focus", onFocus);
  //   return () => window.removeEventListener("focus", onFocus);
  // }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold">Productos</h1>

        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="text-sm text-zinc-600">Actualizando…</span>
          )}

          <button
            onClick={load}
            className="px-4 py-2 rounded-lg border-2 border-slate-900 bg-amber-400 font-bold hover:bg-amber-300 transition"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Nunca mostramos "Cargando productos..." */}
      {ready && products.length === 0 ? (
        <div className="mt-8 p-6 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-zinc-700">
            Aún no hay productos publicados. Ve a “Vender” y crea el primero.
          </p>
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Card key={p.id} product={p as any} />
          ))}
        </section>
      )}
    </main>
  );
}