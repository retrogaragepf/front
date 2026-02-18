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
        <div className="p-6 bg-amber-100 rounded-xl border shadow-sm">
          <p className="text-slate-600 italic">
            Tu carrito está vacío por ahora.
          </p>
        </div>
      ) : (
        cartItems.map((item) => (
          <CartItem key={item.itemId ?? item.id} item={item} />
        ))
      )}
    </section>
  );
}
