"use client";

import Sidebar from "@/src/components/dashboard/Sidebar";
import OrderTracking from "@/src/components/orders/OrderTracking";
import { OrderStatus } from "@/src/types/types";

export default function UserOrdersPage() {
  const order = {
    id: "12345",
    total: 95000,
    status: "DISPATCHED" as OrderStatus,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="flex min-h-screen bg-amber-200">
      <Sidebar />

      <main className="flex-1 p-10 space-y-8">
        <h1 className="text-3xl font-extrabold tracking-wide text-amber-900">
          Mis Compras
        </h1>

        <div className="bg-white border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-amber-900">
              Orden #{order.id}
            </h2>

            <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-blue-200 text-blue-800">
              {order.status}
            </span>
          </div>

          <p className="mt-3 text-zinc-800 font-bold">
            Total: ${order.total.toLocaleString("es-CO")}
          </p>

          <OrderTracking status={order.status} />

          {order.status === "DISPATCHED" && (
            <button className="mt-6 px-4 py-2 rounded-xl border-2 border-emerald-950 bg-emerald-900 text-amber-50 font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
              Marcar como recibido
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
