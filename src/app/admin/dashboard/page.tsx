"use client";

import { useEffect, useState } from "react";
import AdminProductCard from "@/src/components/admin/AdminProductCard";

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Trae solo productos pendientes
    fetch("/api/products?status=pending")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/products/${id}/approve`, { method: "PUT" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/products/${id}/reject`, { method: "PUT" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#f5f2ea]">
      <section className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Panel de Moderación
          </h1>

          <p className="text-zinc-600 mt-2">
            Revisá y aprobá las publicaciones antes de que salgan al marketplace.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 bg-yellow-100 border-2 border-yellow-600 px-4 py-2 rounded-lg">
            <span className="font-bold text-yellow-700">
              Publicaciones pendientes:
            </span>
            <span className="text-xl font-extrabold text-yellow-800">
              {products.length}
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-lg">
            No hay publicaciones pendientes 🎉
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
