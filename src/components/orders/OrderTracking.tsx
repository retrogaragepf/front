"use client";

import { OrderStatus } from "@/src/types/types";

type Props = {
  status: OrderStatus;
  shippedAt?: string;
  deliveredAt?: string;
};

export default function OrderTracking({
  status,
  shippedAt,
  deliveredAt,
}: Props) {
  const steps: OrderStatus[] = [
    "PENDING_PAYMENT",
    "DISPATCHED",
    "DELIVERED",
  ];

  const getLabel = (step: OrderStatus) => {
    if (step === "PENDING_PAYMENT") return "Pago confirmado";
    if (step === "DISPATCHED") return "Despachado";
    if (step === "DELIVERED") return "Entregado";
    return step;
  };

  return (
    <div className="mt-5 rounded-2xl border-2 border-amber-900 bg-amber-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]">
      <h3 className="text-sm font-extrabold tracking-widest uppercase text-amber-900 mb-4">
        Seguimiento del envío
      </h3>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => {
          const active = steps.indexOf(status) >= index;

          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 border-amber-900 ${
                  active ? "bg-amber-900" : "bg-transparent"
                }`}
              />
              <span
                className={`font-bold ${
                  active ? "text-amber-900" : "text-zinc-500"
                }`}
              >
                {getLabel(step)}
              </span>
            </div>
          );
        })}
      </div>

      {shippedAt && (
        <p className="mt-4 text-xs font-bold text-zinc-700">
          Despachado el {new Date(shippedAt).toLocaleDateString()}
        </p>
      )}

      {deliveredAt && (
        <p className="text-xs font-bold text-zinc-700">
          Entregado el {new Date(deliveredAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
