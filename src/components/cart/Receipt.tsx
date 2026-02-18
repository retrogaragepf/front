"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import { showToast } from "nextjs-toast-notify";
import { createCheckoutSession } from "@/src/services/payments";

export default function Receipt() {
  const { itemsCount, totalPrice, cartItems, clearCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);

  const totalFormatted = totalPrice.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  const isEmpty = cartItems.length === 0;

  const handleClearCart = () => {
    if (isEmpty) return;

    clearCart();

    showToast.warning("Carrito vaciado", {
      duration: 2500,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  const runStripeCheckout = async () => {
    const items = cartItems
      .map((it) => ({
        productId: String(it.id ?? "").trim(), // ✅ UI id = productId real
        quantity: Number(it.quantity ?? 0),
      }))
      .filter((x) => x.productId && x.quantity > 0);

    if (!items.length) throw new Error("Tu carrito está vacío.");

    const { url } = await createCheckoutSession(items);

    if (!url || typeof url !== "string") {
      throw new Error("Stripe no devolvió una URL de checkout válida.");
    }

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
      await runStripeCheckout();
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
              : "bg-amber-600 hover:bg-emerald-600"
          }`}
          title="Checkout con Stripe (TEST)"
        >
          {isPaying ? "Redirigiendo..." : "Ir a pagar"}
        </button>

        <button
          onClick={handleClearCart}
          disabled={isEmpty || isPaying}
          className={`w-full px-4 py-3 rounded-lg border-2 border-slate-900 font-bold transition ${
            isEmpty || isPaying
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-white hover:bg-red-600"
          }`}
        >
          Vaciar carrito
        </button>

        <Link
          href="/product"
          className="w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-white hover:bg-emerald-600 transition"
        >
          Seguir comprando
        </Link>
      </div>
    </aside>
  );
}
