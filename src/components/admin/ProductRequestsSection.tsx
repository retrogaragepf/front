"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
    };

    loadProducts();
  }, []);

  const handleStatusChange = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    const confirmAction = confirm(
      `¿Seguro que querés ${
        status === "approved" ? "aprobar" : "rechazar"
      } este producto?`
    );

    if (!confirmAction) return;

    await updateProductStatus(id, status);

    const updated = await getAllProducts();
    setProducts(updated);
  };

  const filteredProducts =
    filter === "all"
      ? products
      : products.filter((p) => p.status === filter);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Product Requests
      </h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "approved", "rejected"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 border rounded ${
                filter === f ? "bg-black text-white" : ""
              }`}
            >
              {f}
            </button>
          )
        )}
      </div>

      <table className="w-full border">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Seller</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id} className="border-b">
              <td className="p-2">{product.title}</td>

              {/* 👇 CORREGIDO */}
              <td className="p-2">{product.sellerId}</td>

              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-sm font-semibold ${
                    product.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : product.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.status}
                </span>
              </td>

              <td className="p-2 flex gap-2">
                {product.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleStatusChange(
                          product.id,
                          "approved"
                        )
                      }
                      className="px-2 py-1 bg-green-600 text-white rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleStatusChange(
                          product.id,
                          "rejected"
                        )
                      }
                      className="px-2 py-1 bg-red-600 text-white rounded"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {filteredProducts.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="text-center p-4 text-gray-500"
              >
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
