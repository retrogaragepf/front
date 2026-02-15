"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import { showToast } from "nextjs-toast-notify";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/src/services/payments";

const LAST_ORDER_KEY = "retrogarage_last_order";
const CHECKOUT_MODE = (
  process.env.NEXT_PUBLIC_CHECKOUT_MODE || "mock"
).toLowerCase(); // "mock" | "stripe"

export default function Receipt() {
  const { itemsCount, totalPrice, clearCart, cartItems } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const router = useRouter();

  const totalFormatted = totalPrice.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  const isEmpty = cartItems.length === 0;

  const handleClearCart = () => {
    if (isEmpty) return;

    clearCart();

    showToast.warning("Carrito vaciado", {
      duration: 4000,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  const runMockCheckout = async () => {
    showToast.success("Procesando pago (MOCK)...", {
      duration: 1500,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });

    await new Promise((r) => setTimeout(r, 1200));

    const orderId = `RG-${Date.now()}`;
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      itemsCount,
      totalPrice,
      currency: "COP",
      status: "paid",
      provider: "stripe_mock",
      items: cartItems,
    };

    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    clearCart();
    router.push("/checkout/success");
  };

  const runStripeCheckout = async () => {
    const { url } = await createCheckoutSession(cartItems);

    showToast.success("Redirigiendo a Stripe (TEST)...", {
      duration: 2000,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });

    window.location.href = url;
  };

  const handleCheckout = async () => {
    if (isEmpty || isPaying) return;

    try {
      setIsPaying(true);

      if (CHECKOUT_MODE === "stripe") {
        await runStripeCheckout();
      } else {
        await runMockCheckout();
      }
    } catch (err: any) {
      showToast.error(err?.message || "No se pudo iniciar el pago", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      setIsPaying(false);
    }
  };

  return (
    <aside className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
      <h3 className="font-display text-xl">Resumen</h3>

      <div className="flex items-center justify-between">
        <span className="text-slate-600 italic">Items</span>
        <span className="font-bold">{itemsCount}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-slate-600 italic">Total</span>
        <span className="font-bold text-xl">${totalFormatted}</span>
      </div>

      <div className="pt-2 flex flex-col gap-3">
        <button
          onClick={handleCheckout}
          disabled={isEmpty || isPaying}
          className={`w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold transition ${
            isEmpty || isPaying
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-amber-400 hover:bg-amber-300"
          }`}
          title={
            CHECKOUT_MODE === "stripe"
              ? "Checkout con Stripe (TEST)"
              : "Checkout simulado (MOCK)"
          }
        >
          {isPaying ? "Procesando..." : "Ir a pagar"}
        </button>

        <button
          onClick={handleClearCart}
          disabled={isEmpty}
          className={`w-full px-4 py-3 rounded-lg border-2 border-slate-900 font-bold transition ${
            isEmpty
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-white hover:bg-amber-100"
          }`}
        >
          Vaciar carrito
        </button>

        <Link
          href="/product"
          className="w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-white hover:bg-amber-100 transition"
        >
          Seguir comprando
        </Link>
      </div>
    </aside>
  );
}
