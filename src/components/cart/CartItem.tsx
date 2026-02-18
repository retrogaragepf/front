"use client";

import React, { useMemo } from "react";
import {
  useCart,
  type CartItem as CartItemType,
} from "@/src/context/CartContext";

export default function CartItem({ item }: { item: CartItemType }) {
  const { increaseQty, decreaseQty, removeFromCart } = useCart();

  // ✅ key único/seguro para acciones (si hay remoto, usa itemId)
  const key = useMemo(
    () => String(item.itemId ?? item.id ?? "").trim(),
    [item],
  );

  const priceFormatted = Number(item.price ?? 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  const fallbackImg =
    "https://res.cloudinary.com/dyylxjijf/image/upload/v1770321127/Camara_ypblyh.png";

  return (
    <div className="flex items-center gap-6 p-6 bg-white rounded-xl border shadow-sm relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image || fallbackImg}
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
            {/* <button
              className="px-2"
              onClick={() => key && decreaseQty(key)}
              aria-label="Disminuir cantidad"
              disabled={!key}
              title={!key ? "Item sin id válido" : ""}
            >
              -
            </button> */}

            <span className="px-3">{item.quantity}</span>

            {/* <button
              className="px-2"
              onClick={() => key && increaseQty(key)}
              aria-label="Aumentar cantidad"
              disabled={!key}
              title={!key ? "Item sin id válido" : ""}
            >
              +
            </button> */}
          </div>
        </div>
      </div>

      <button
        className="absolute top-4 right-4 text-slate-400"
        onClick={() => {
          console.log("❌ CLICK remove key =>", key, {
            id: item.id,
            itemId: item.itemId,
            title: item.title,
          });

          if (!key) return; // ✅ evita borrar todo si no hay id válido
          removeFromCart(key); // ✅ usa el mismo id seguro que +/-
        }}
        aria-label="Eliminar del carrito"
        disabled={!key}
        title={!key ? "Item sin id válido" : ""}
      >
        ❌
      </button>
    </div>
  );
}
