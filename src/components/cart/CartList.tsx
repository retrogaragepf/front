"use client";

import CartItem from "./CartItem";
import { useCart } from "@/src/context/CartContext";

export default function CartList() {
  const { cartItems } = useCart();

  return (
    <section className="space-y-8">
      <h2 className="font-display text-2xl mb-6">
        Tus compras
      </h2>

      {cartItems.length === 0 ? (
        <p className="text-slate-600">Tu carrito esta vacio por ahora.</p>
      ) : (
        cartItems.map((item) => (
          <CartItem key={item.itemId ?? item.id} item={item} />
        ))
      )}
    </section>
  );
}
