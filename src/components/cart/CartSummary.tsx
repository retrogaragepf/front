"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import { showToast } from "nextjs-toast-notify";

export default function CartSummary() {
  const { itemsCount, totalPrice, clearCart, cartItems } = useCart();

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

  return (
    <aside className="p-6 bg-amber-100 rounded-xl border shadow-sm space-y-4">
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
        <Link
          href="/checkout"
          className={`w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold transition ${
            isEmpty
              ? "bg-slate-200 text-slate-500 pointer-events-none"
              : "bg-amber-400 hover:bg-amber-300"
          }`}
          aria-disabled={isEmpty}
        >
          Ir a pagar
        </Link>

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
          href="/products"
          className="w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-white hover:bg-amber-100 transition"
        >
          Seguir comprando
        </Link>
      </div>
    </aside>
  );
}
