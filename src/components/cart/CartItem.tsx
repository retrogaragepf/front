"use client";

import React from "react";
import {
  useCart,
  type CartItem as CartItemType,
} from "@/src/context/CartContext";

export default function CartItem({ item }: { item: CartItemType }) {
  const { increaseQty, decreaseQty, removeFromCart } = useCart();

  const priceFormatted = item.price.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  return (
    <div className="flex items-center gap-6 p-6 bg-white rounded-xl border shadow-sm relative">
      <img
        src={
          item.image ||
          "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321127/Camara_ypblyh.png"
        }
        alt={item.title}
        className="w-24 h-24 rounded-lg object-cover bg-slate-200"
        loading="lazy"
      />

      <div className="flex-1">
        <h3 className="font-handwritten text-lg font-bold">{item.title}</h3>

        <p className="italic text-slate-500 text-sm">
          {item.categoryName ? `${item.categoryName} • ` : ""}
          {item.eraName ? item.eraName : "Retro"}
        </p>

        <div className="flex items-center gap-4 mt-4">
          <span className="font-bold text-xl">${priceFormatted}</span>

          <div className="flex items-center border rounded-lg">
            <button
              className="px-2"
              onClick={() => decreaseQty(item.id)}
              aria-label="Disminuir cantidad"
            >
              -
            </button>

            <span className="px-3">{item.quantity}</span>

            <button
              className="px-2"
              onClick={() => increaseQty(item.id)}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        className="absolute top-4 right-4 text-slate-400"
        onClick={() => removeFromCart(item.id)}
        aria-label="Eliminar del carrito"
      >
        x
      </button>
    </div>
  );
}
