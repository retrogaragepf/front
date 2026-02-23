"use client";

import { useEffect, useState, useMemo } from "react";
import { IProduct } from "@/src/interfaces/product.interface";
import {
  getAllProducts,
  updateProductStatus,
} from "@/src/services/products.services";

export default function ProductRequestsSection() {
  const [products, setProducts] = useState<IProduct[]>([]);

  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const productData = await getAllProducts();
      setProducts(productData);
    };

    load();
  }, []);

  // ✅ Email vendedor: intenta varias shapes sin romper nada
  const getSellerEmail = (product: any) => {
    return (
      product?.user?.email ||
      product?.seller?.email ||
      product?.owner?.email ||
      "Email no disponible"
    );
  };

  const handleStatusChange = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    const confirmAction = confirm(
      `¿Seguro que querés ${status === "approved" ? "aprobar" : "rechazar"} este producto?`,
    );

    if (!confirmAction) return;

    await updateProductStatus(id, status);
    const updated = await getAllProducts();
    setProducts(updated);
  };

  const processedProducts = useMemo(() => {
    let filtered =
      filter === "all"
        ? products
        : products.filter((p: any) => p.status === filter);

    filtered = filtered.filter((p: any) =>
      (p.title || "").toLowerCase().includes(search.toLowerCase()),
    );

    return [...filtered]
      .map((product, index) => ({ product, index }))
      .sort((a: any, b: any) => {
        const aTs = Date.parse(
          String(
            a.product?.createdAt ??
              a.product?.created_at ??
              a.product?.publishedAt ??
              a.product?.updatedAt ??
              "",
          ),
        );
        const bTs = Date.parse(
          String(
            b.product?.createdAt ??
              b.product?.created_at ??
              b.product?.publishedAt ??
              b.product?.updatedAt ??
              "",
          ),
        );

        const hasATs = Number.isFinite(aTs);
        const hasBTs = Number.isFinite(bTs);
        if (hasATs && hasBTs && aTs !== bTs) return bTs - aTs;
        if (hasATs && !hasBTs) return -1;
        if (!hasATs && hasBTs) return 1;

        // Fallback: último recibido primero (útil cuando el backend no expone fechas)
        return b.index - a.index;
      })
      .map((entry) => entry.product);
  }, [products, filter, search]);

  return (
    <div>
      <h2 className="font-display text-2xl text-amber-900 mb-2">
        Solicitudes de Productos
      </h2>

      <p className="text-zinc-700 mb-6">
        Revisá y moderá publicaciones antes de que salgan al marketplace.
      </p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] ${
              filter === f
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            {f}
          </button>
        ))}

        <input
          type="text"
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border-2 border-amber-900 text-amber-900 font-semibold"
        />
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {processedProducts.map((product: any) => (
          <div
            key={product.id}
            className="bg-white border-2 border-amber-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-lg text-amber-900 mb-2">
                {product.title}
              </h3>

              <p className="text-sm text-zinc-600 mb-3">
                {product.description?.slice(0, 100)}...
              </p>

              <p className="font-extrabold text-zinc-800 mb-2">
                $
                {Number(product.price ?? 0).toLocaleString("es-CO", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>

              <p className="text-xs text-zinc-500 mb-4">
                Vendedor:
                <span className="ml-1 font-bold text-amber-900">
                  {getSellerEmail(product)}
                </span>
              </p>

              <div className="mb-4">
                {product.status === "pending" && (
                  <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-extrabold">
                    PENDIENTE
                  </span>
                )}
                {product.status === "approved" && (
                  <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-extrabold">
                    APROBADO
                  </span>
                )}
                {product.status === "rejected" && (
                  <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-extrabold">
                    RECHAZADO
                  </span>
                )}
              </div>
            </div>

            {product.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(product.id, "approved")}
                  className="flex-1 px-3 py-2 rounded-lg font-extrabold border-2 bg-emerald-700 text-white border-emerald-800"
                >
                  Aprobar
                </button>

                <button
                  onClick={() => handleStatusChange(product.id, "rejected")}
                  className="flex-1 px-3 py-2 rounded-lg font-extrabold border-2 bg-red-600 text-white border-red-700"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {processedProducts.length === 0 && (
        <p className="text-center text-zinc-500 mt-10">
          No hay productos en esta categoría.
        </p>
      )}
    </div>
  );
}
