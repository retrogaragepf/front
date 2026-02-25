"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/src/components/Card";
import { getAllProducts } from "@/src/services/products.services";
import type { IProduct } from "@/src/interfaces/product.interface";

function getStock(p: any) {
  const n = Number(p?.stock ?? 0);
  return Number.isFinite(n) ? n : 0;
}

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

  // ✅ SOLO APROBADOS
  const approvedProducts = useMemo(() => {
    return (products || []).filter((p: any) => p?.status === "approved");
  }, [products]);

  // ✅ Orden: primero con stock, luego agotados (pero TODOS visibles)
  const sortedApproved = useMemo(() => {
    const list = [...approvedProducts];

    list.sort((a: any, b: any) => {
      const sa = getStock(a);
      const sb = getStock(b);

      const aOut = sa <= 0;
      const bOut = sb <= 0;

      // disponibles primero
      if (aOut !== bOut) return aOut ? 1 : -1;

      // opcional: por fecha o título, para estabilidad
      const da = new Date(a?.createdAt ?? 0).getTime();
      const db = new Date(b?.createdAt ?? 0).getTime();
      if (Number.isFinite(da) && Number.isFinite(db) && da !== db)
        return db - da;

      return String(a?.title ?? "").localeCompare(String(b?.title ?? ""));
    });

    return list;
  }, [approvedProducts]);

  return (
    <div className="bg-amber-100">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl sm:text-4xl font-typewriter text-amber-900 font-bold">Productos</h2>
            {ready && (
              <p className="text-lg text-zinc-700 mt-1">
                Mostrando:{" "}
                <span className="font-bold">{sortedApproved.length}</span>{" "}
                publicados
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="text-sm text-zinc-600">Actualizando…</span>
            )}

            <button
              onClick={load}
              className="shrink-0 px-4 py-2 rounded-xl border-2 text-amber-50 border-zinc-900 bg-emerald-900 hover:bg-amber-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* ✅ Nunca mostramos "Cargando productos..." */}
        {ready && sortedApproved.length === 0 ? (
          <div className="mt-8 p-6 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <p className="text-zinc-700">
              Aún no hay productos publicados. Ve a “Vender” y crea el primero.
            </p>
          </div>
        ) : (
          <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedApproved.map((p: any) => {
              const stock = getStock(p);
              const isOut = stock <= 0;

              return (
                <div key={p.id} className="relative">
                  {/* ✅ “Efecto agotado” solo visual: opacidad */}
                  <div className={isOut ? "opacity-70" : ""}>
                    <Card product={p} />
                  </div>

                  {/* ✅ Stock visible SIEMPRE */}
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border-2 border-zinc-900 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                        ${
                          isOut
                            ? "bg-rose-900 text-rose-100"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                    >
                      {isOut ? "AGOTADO" : `STOCK: ${stock}`}
                    </span>

                    {/* opcional: mini texto a la derecha */}
                    {!isOut ? (
                      <span className="text-xs text-zinc-600">Disponibles</span>
                    ) : (
                      <span className="text-xs text-rose-900 font-semibold">
                        Agotado por ahora. 👀
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}