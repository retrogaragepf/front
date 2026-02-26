"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { createCheckoutSession } from "@/src/services/stripe.services";
import { showToast } from "nextjs-toast-notify";

export default function CheckoutButton() {
  const router = useRouter();
  const { cartItems } = useCart();
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  // ✅ Stripe: SOLO productId + quantity (no price)
  const items = useMemo(
    () =>
      cartItems
        .map((it) => ({
          productId: String(it.id ?? "").trim(),
          quantity: Number(it.quantity ?? 0),
        }))
        .filter((x) => x.productId && x.quantity > 0),
    [cartItems],
  );

  const handleCheckout = async () => {
    if (!isAuth) {
      showToast.error("Necesitas registrarte primero", {
        duration: 3000,
        position: "top-center",
      });
      router.push("/register"); // ✅ cambia si tu ruta real es otra
      return;
    }

    if (!items.length) {
      showToast.error("Tu carrito está vacío.");
      return;
    }

    try {
      setLoading(true);
      const { url } = await createCheckoutSession(items);

      if (!url) throw new Error("Stripe no devolvió la URL de pago.");
      window.location.href = url;
    } catch (err: any) {
      const msg = String(err?.message || "Error iniciando el pago.");

      // ✅ por si el back responde 401 igual
      if (msg.toLowerCase().includes("unauthorized")) {
        showToast.error("Necesitas registrarte primero", {
          duration: 3000,
          position: "top-center",
        });
        router.push("/register");
        return;
      }

      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !items.length}
      className={`w-full border-2 border-slate-900 py-2 uppercase tracking-tight transition-all font-display ${
        loading || !items.length
          ? "bg-slate-200 text-slate-600 cursor-not-allowed"
          : "bg-emerald-400 hover:bg-emerald-300"
      }`}
    >
      {loading ? "Redirigiendo…" : "Pagar con Stripe"}
    </button>
  );
}
