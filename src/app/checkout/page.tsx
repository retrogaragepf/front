"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";

type CartItemSafe = {
  id?: string | number;
  name?: string;
  title?: string;
  price?: number | string;
  quantity?: number;
  image?: string;
  imageUrl?: string;
};

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", { minimumFractionDigits: 0 });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { dataUser } = useAuth();
  const cart = useCart() as any;

  const cartItems: CartItemSafe[] = cart?.cartItems ?? cart?.items ?? [];
  const clearCart = cart?.clearCart ?? cart?.clear ?? null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Datos usuario (sin asumir shape)
  const user = (dataUser as any)?.user ?? dataUser ?? {};
  const userName = user?.name ?? user?.fullName ?? "Usuario";
  const userAddress = user?.address ?? "";
  const userPhone = user?.phone ?? "";

  const computed = useMemo(() => {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = items.reduce((acc, it) => {
      const priceNum = Number(it?.price ?? 0);
      const qty = Number(it?.quantity ?? 1);
      return acc + (Number.isFinite(priceNum) ? priceNum * qty : 0);
    }, 0);

    const shipping = subtotal > 500000 ? 0 : 20000; // puedes ajustar
    const total = subtotal + shipping;

    return { items, subtotal, shipping, total };
  }, [cartItems]);

  const handlePay = async () => {
    if (!computed.items.length) {
      showToast.warning("Tu carrito está vacío", {
        duration: 3000,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      /**
       * ✅ DEMO2 SAFE:
       * - Aquí luego llamas a tu back:
       *   1) crear orden
       *   2) crear pago y redirigir a pasarela
       * Por ahora: simulación pro para demo.
       */

      await new Promise((r) => setTimeout(r, 900));

      showToast.success("✅ Pedido generado (Demo2) — Pago simulado", {
        duration: 3500,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });

      // Si tienes clearCart en tu CartContext, lo usamos
      if (typeof clearCart === "function") {
        clearCart();
      }

      router.push("/dashboard");
    } catch (e: any) {
      showToast.error(e?.message ?? "Error procesando el pago", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-200 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <section className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-amber-900">
                Checkout
              </h1>
              <p className="mt-1 text-sm text-zinc-700">
                Confirma tu orden y procede al pago.
              </p>
            </div>

            <button
              onClick={() => router.push("/cart")}
              className="inline-flex justify-center px-5 py-2 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-extrabold tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
            >
              Volver al carrito
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Items */}
          <section className="lg:col-span-2 bg-white border-2 border-amber-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden">
            <div className="bg-amber-100 border-b-2 border-amber-900 px-6 py-4">
              <h2 className="text-lg font-extrabold tracking-wide text-amber-900">
                Productos en tu orden
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {computed.items.length ? (
                computed.items.map((it, idx) => {
                  const title = it?.name ?? it?.title ?? "Producto";
                  const priceNum = Number(it?.price ?? 0);
                  const qty = Number(it?.quantity ?? 1);
                  const img = it?.imageUrl ?? it?.image ?? "";

                  return (
                    <div
                      key={String(it?.id ?? idx)}
                      className="flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-900 bg-amber-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]"
                    >
                      <div className="h-16 w-16 rounded-xl border-2 border-amber-900 bg-white overflow-hidden flex items-center justify-center">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-zinc-500 font-bold">
                            sin imagen
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-extrabold text-zinc-900">{title}</p>
                        <p className="text-sm text-zinc-600">
                          Cantidad: <span className="font-bold">{qty}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-extrabold text-zinc-900">
                          ${" "}
                          {formatCOP(Number.isFinite(priceNum) ? priceNum : 0)}
                        </p>
                        <p className="text-xs text-zinc-600">
                          Subtotal:{" "}
                          <span className="font-bold">
                            $ {formatCOP(priceNum * qty)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-2xl border-2 border-amber-900 bg-amber-50 text-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]">
                  Tu carrito está vacío. Agrega productos para continuar.
                </div>
              )}
            </div>
          </section>

          {/* Right: Summary */}
          <aside className="bg-amber-50 border-2 border-amber-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] space-y-4">
            <div className="pb-3 border-b-2 border-amber-300">
              <h3 className="text-lg font-extrabold tracking-wide text-amber-900">
                Resumen
              </h3>
              <p className="text-sm text-zinc-700">
                Cliente: <span className="font-bold">{userName}</span>
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-700">Subtotal</span>
                <span className="font-extrabold text-zinc-900">
                  $ {formatCOP(computed.subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-700">Envío</span>
                <span className="font-extrabold text-zinc-900">
                  {computed.shipping === 0
                    ? "Gratis"
                    : `$ ${formatCOP(computed.shipping)}`}
                </span>
              </div>

              <div className="mt-2 h-[2px] w-full bg-amber-300" />

              <div className="flex justify-between text-base">
                <span className="font-extrabold text-amber-900">Total</span>
                <span className="font-extrabold text-amber-900">
                  $ {formatCOP(computed.total)}
                </span>
              </div>
            </div>

            {/* Shipping info */}
            <div className="rounded-2xl border-2 border-amber-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]">
              <p className="text-xs font-extrabold text-zinc-700">
                Datos de entrega
              </p>
              <p className="mt-1 text-sm text-zinc-800">
                {userAddress ? (
                  <>
                    <span className="font-bold">Dirección:</span> {userAddress}
                  </>
                ) : (
                  <span className="text-zinc-600">
                    Aún no tienes dirección guardada (puedes agregarla en tu
                    Dashboard).
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-800">
                {userPhone ? (
                  <>
                    <span className="font-bold">Teléfono:</span> {userPhone}
                  </>
                ) : null}
              </p>
            </div>

            <button
              onClick={handlePay}
              disabled={isSubmitting || !computed.items.length}
              className="w-full inline-flex justify-center px-5 py-3 rounded-2xl border-2 border-emerald-900 bg-emerald-200 text-emerald-900 font-extrabold tracking-wide shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)] disabled:opacity-60 disabled:cursor-not-allowed hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition"
            >
              {isSubmitting ? "Procesando..." : "Pagar"}
            </button>

            <p className="text-xs text-zinc-600">
              * Demo2: UI lista. Cuando el back tenga pagos/órdenes, aquí
              conectamos la pasarela real.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
