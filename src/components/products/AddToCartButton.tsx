"use client";

import React from "react";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import type { IUserProduct } from "@/src/interfaces/userProduct.interface";

type Props =
  | { product: IProductWithDetails; userProduct?: never }
  | { userProduct: IUserProduct; product?: never };

export default function AddToCartButton(props: Props) {
  const { addProduct, addUserProduct, cartItems } = useCart();

  const product = "product" in props ? props.product : undefined;
  const userProduct = "userProduct" in props ? props.userProduct : undefined;

  const id = product ? String(product.id) : String(userProduct!.id);
  const title = product ? product.title : userProduct!.titulo;
  const stock = product ? (product.stock ?? 0) : userProduct!.stock;

  const isOut = stock <= 0;
  const alreadyInCart = cartItems.some((it) => it.id === id);

  const handleAdd = () => {
    if (isOut) return;

    if (alreadyInCart) {
      showToast.info("Ya está en tu carrito", {
        duration: 3000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

    if (product) addProduct(product, 1);
    else addUserProduct(userProduct!, 1);

    showToast.success(`Agregado: ${title}`, {
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
      disabled={isOut || alreadyInCart}
      aria-disabled={isOut || alreadyInCart}
      aria-label={
        isOut
          ? `Agotado: ${title}`
          : alreadyInCart
            ? `Ya en el carrito: ${title}`
            : `Agregar al carrito: ${title}`
      }
    >
      {isOut
        ? "Agotado"
        : alreadyInCart
          ? "Ya en el carrito ✅"
          : "Agregar al carrito 🛒"}
    </button>
  );
}
