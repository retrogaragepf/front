"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import { showToast } from "nextjs-toast-notify";
import { createCheckoutSession } from "@/src/services/payments";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // soporte token directo o { token }
  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

type CouponResponse = {
  valid: boolean;
  code: string;
  type: "PERCENT";
  value: number; // 10 => 10%
  message?: string;
};

export default function Receipt() {
  const { itemsCount, totalPrice, cartItems, clearCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);

  // -----------------------
  // Coupon state
  // -----------------------
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<CouponResponse | null>(
    null,
  );
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const isEmpty = cartItems.length === 0;

  // -----------------------
  // Totals (subtotal + discount + final)
  // -----------------------
  const discountAmount = useMemo(() => {
    if (!couponApplied?.valid) return 0;

    // Por ahora: solo porcentaje (10%)
    const pct = Number(couponApplied.value ?? 0);
    if (pct <= 0) return 0;

    // COP sin decimales
    return Math.round((totalPrice * pct) / 100);
  }, [couponApplied, totalPrice]);

  const totalFinal = useMemo(() => {
    const v = totalPrice - discountAmount;
    return v > 0 ? v : 0;
  }, [totalPrice, discountAmount]);

  const subtotalFormatted = totalPrice.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  const discountFormatted = discountAmount.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  const totalFormatted = totalFinal.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
  });

  // -----------------------
  // Actions
  // -----------------------
  const handleClearCart = () => {
    if (isEmpty) return;

    clearCart();
    // Si vacía el carrito, también limpiamos el cupón aplicado (opcional pero recomendado)
    setCouponApplied(null);
    setCouponInput("");

    showToast.warning("Carrito vaciado", {
      duration: 2500,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast.warning("Pega o escribe un código de descuento.", {
        duration: 2500,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const token = getToken();

      // ✅ Ajusta esta ruta si tu backend la llama diferente
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code }),
      });

      const data = (await res.json().catch(() => ({}))) as CouponResponse;

      if (!res.ok || !data?.valid) {
        setCouponApplied(null);
        showToast.error(data?.message || "Cupón inválido o expirado.", {
          duration: 3500,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      setCouponApplied(data);

      showToast.success(`Cupón aplicado: -${data.value}% ✅`, {
        duration: 2500,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    } catch (err: any) {
      setCouponApplied(null);
      showToast.error(err?.message || "No se pudo validar el cupón.", {
        duration: 3500,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponInput("");

    showToast.info("Cupón removido.", {
      duration: 2000,
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

    // ✅ Mandamos el cupón al back para que lo aplique server-side (Stripe)
    const couponCode = couponApplied?.valid ? couponApplied.code : undefined;

    const { url } = await createCheckoutSession(items, couponCode);

    if (!url || typeof url !== "string") {
      throw new Error("Stripe no devolvió una URL de checkout válida.");
    }

    showToast.success("Redirigiendo a Stripe...", {
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
    <aside className="p-6 bg-amber-100 rounded-xl border shadow-sm space-y-4">
      <h3 className="font-display text-xl">Resumen</h3>

      <div className="flex items-center justify-between">
        <span className="text-slate-600 italic">Items</span>
        <span className="font-bold">{itemsCount}</span>
      </div>

      {/* ✅ Cupón */}
      <div className="pt-2 space-y-2">
        <label className="text-slate-600 italic text-sm">
          Código de descuento
        </label>

        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Pega aquí tu código (ej: RETRO10)"
            className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-900 text-sm outline-none"
            disabled={isPaying}
            autoComplete="off"
          />

          {!couponApplied?.valid ? (
            <button
              onClick={applyCoupon}
              disabled={isPaying || isValidatingCoupon || isEmpty}
              className={`px-4 py-2 rounded-lg border-2 border-slate-900 font-bold transition ${
                isPaying || isValidatingCoupon || isEmpty
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-amber-600 hover:bg-emerald-600"
              }`}
              title="Validar y aplicar cupón"
            >
              {isValidatingCoupon ? "Validando..." : "Aplicar"}
            </button>
          ) : (
            <button
              onClick={removeCoupon}
              disabled={isPaying}
              className={`px-4 py-2 rounded-lg border-2 border-slate-900 font-bold transition ${
                isPaying
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-white hover:bg-red-600"
              }`}
              title="Quitar cupón"
            >
              Quitar
            </button>
          )}
        </div>

        {couponApplied?.valid && (
          <div className="text-xs font-bold">
            Cupón activo: {couponApplied.code} (-{couponApplied.value}%)
          </div>
        )}
      </div>

      {/* ✅ Totales */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 italic">Subtotal</span>
          <span className="font-bold">${subtotalFormatted}</span>
        </div>

        {couponApplied?.valid && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600 italic">Descuento</span>
            <span className="font-bold">- ${discountFormatted}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-slate-600 italic">Total</span>
          <span className="font-bold text-xl">${totalFormatted}</span>
        </div>
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
