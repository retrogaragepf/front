"use client";

import React from "react";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import type { IProductWithDetails } from "@/src/interfaces/product.interface";
import type { IUserProduct } from "@/src/interfaces/userProduct.interface";

type Props =
  | { product: IProductWithDetails; userProduct?: never }
  | { userProduct: IUserProduct; product?: never };

export default function AddToCartButton(props: Props) {
  const { addProduct, addUserProduct, cartItems } = useCart();
  const { dataUser } = useAuth();

  const product = "product" in props ? props.product : undefined;
  const userProduct = "userProduct" in props ? props.userProduct : undefined;

  const id = product ? String(product.id) : String(userProduct!.id);
  const title = product ? product.title : userProduct!.titulo;
  const stock = product ? (product.stock ?? 0) : userProduct!.stock;

  // ✅ usuario logeado (soporta dataUser.user.id o dataUser.id)
  const currentUserId = String(
    (dataUser as any)?.user?.id ?? (dataUser as any)?.id ?? "",
  ).trim();

  // ✅ dueño/publicador del item (soporta varias shapes)
  const ownerId = String(
    (product as any)?.user?.id ??
      (product as any)?.seller?.id ??
      (product as any)?.owner?.id ??
      (product as any)?.userId ??
      (product as any)?.sellerId ??
      (product as any)?.ownerId ??
      (userProduct as any)?.user?.id ??
      (userProduct as any)?.seller?.id ??
      (userProduct as any)?.owner?.id ??
      (userProduct as any)?.userId ??
      (userProduct as any)?.sellerId ??
      (userProduct as any)?.ownerId ??
      "",
  ).trim();

  // ✅ bloqueo UI: no permitir agregar publicación propia
  const isOwnProduct =
    !!currentUserId && !!ownerId && currentUserId === ownerId;

  const isOut = stock <= 0;
  const alreadyInCart = cartItems.some((it) => String(it.id) === id);

  const handleAdd = () => {
    // ✅ guard nuevo (sin romper lógica actual)
    if (isOwnProduct) {
      showToast.warning("No puedes comprar tus propias publicaciones", {
        duration: 3000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

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

  const isDisabled = isOut || alreadyInCart || isOwnProduct;

  return (
    <button
      className={`
        w-full sm:w-auto
        px-4 py-3 rounded-xl border-2 font-extrabold tracking-wide text-sm
        transition
        ${
          isDisabled
            ? "border-zinc-400 bg-zinc-200 text-zinc-600 cursor-not-allowed opacity-90 shadow-none hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none"
            : "border-emerald-950 bg-emerald-900 text-amber-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]"
        }
      `}
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      title={
        isOwnProduct
          ? "No puedes comprar tu propia publicación"
          : isOut
            ? "Producto agotado"
            : alreadyInCart
              ? "Ya está en tu carrito"
              : "Agregar al carrito"
      }
      aria-label={
        isOwnProduct
          ? `Tu publicación: ${title}`
          : isOut
            ? `Agotado: ${title}`
            : alreadyInCart
              ? `Ya en el carrito: ${title}`
              : `Agregar al carrito: ${title}`
      }
    >
      {isOwnProduct
        ? "Tu publicación"
        : isOut
          ? "Agotado"
          : alreadyInCart
            ? "Ya en el carrito ✅"
            : "Agregar al carrito 🛒"}
    </button>
  );
}
