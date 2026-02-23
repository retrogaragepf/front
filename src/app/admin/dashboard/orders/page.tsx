"use client";

import AdminLayout from "@/src/components/admin/AdminLayout";
import OrderTracking from "@/src/components/orders/OrderTracking";
import { useState } from "react";
import { OrderStatus } from "@/src/types/types";

export default function AdminOrdersPage() {
  const [section, setSection] = useState<"users" | "products">("users");

  const order = {
    id: "12345",
    total: 95000,
    status: "PENDING_PAYMENT" as OrderStatus,
    createdAt: new Date().toISOString(),
  };

  return (
    <AdminLayout section={section} setSection={setSection}>
      <h1 className="font-display text-3xl text-amber-900 mb-6">
        Órdenes
      </h1>

      <div className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <div className="flex justify-between items-center">
          <h2 className="font-extrabold text-amber-900">
            Orden #{order.id}
          </h2>

          <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-yellow-200 text-yellow-800">
            {order.status}
          </span>
        </div>

        <p className="mt-3 text-zinc-800 font-bold">
          Total: ${order.total.toLocaleString("es-CO")}
        </p>

        <OrderTracking status={order.status} />

        {order.status === "PENDING_PAYMENT" && (
          <button className="mt-6 px-4 py-2 rounded-xl border-2 border-amber-900 bg-amber-900 text-amber-50 font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            Marcar como despachado
          </button>
        )}
      </div>
    </AdminLayout>
  );
}
