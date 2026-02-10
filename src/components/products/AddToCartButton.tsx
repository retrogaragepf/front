"use client";

import React from "react";
import { useCart } from "@/src/context/CartContext";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import { showToast } from "nextjs-toast-notify";

export default function AddToCartButton({
  product,
}: {
  product: IProductWithDetails;
}) {
  const { addProduct } = useCart();

  const isOut = (product.stock ?? 0) <= 0;

  const handleAdd = () => {
    if (isOut) return;

    addProduct(product, 1);

    showToast.success("Agregado al carrito 🛒", {
      duration: 4000,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  return (
    <button
      className="
        w-full sm:w-auto
        px-4 py-3 rounded-xl border-2 border-emerald-950
        bg-emerald-900 text-amber-50 font-extrabold tracking-wide text-sm
        shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
        hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
        active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
        transition
      "
      type="button"
      onClick={handleAdd}
      disabled={isOut}
      aria-disabled={isOut}
    >
      {isOut ? "Agotado" : "Agregar al carrito 🛒"}
    </button>
  );
}
