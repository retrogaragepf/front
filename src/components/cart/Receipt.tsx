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

  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

type DiscountValidateResponse = {
  valid?: boolean;
  code?: string;
  percentage?: number; // 10 => 10%
  discountAmount?: number;
  finalTotal?: number;
  message?: string;
};

type CouponApplied = {
  valid: boolean;
  code: string;
  type: "PERCENT";
  value: number; // percentage
  discountAmount: number;
  finalTotal: number;
  message?: string;
};

export default function Receipt() {
  const { itemsCount, totalPrice, cartItems, clearCart } = useCart();
  const [isPaying, setIsPaying] = useState(false);

  // -----------------------
  // Coupon state
  // -----------------------
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<CouponApplied | null>(
    null,
  );
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const isEmpty = cartItems.length === 0;

  // -----------------------
  // Totals (subtotal + discount + final)
  // -----------------------
  const discountAmount = useMemo(() => {
    if (!couponApplied?.valid) return 0;
    const n = Number(couponApplied.discountAmount ?? 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [couponApplied]);

  const totalFinal = useMemo(() => {
    if (!couponApplied?.valid) return totalPrice;

    const n = Number(couponApplied.finalTotal ?? 0);
    return Number.isFinite(n) && n >= 0 ? n : totalPrice;
  }, [couponApplied, totalPrice]);

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

    if (isEmpty) {
      showToast.warning("Tu carrito está vacío.", {
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

      const res = await fetch(`${API_BASE_URL}/discounts/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code }),
      });

      const data = (await res
        .json()
        .catch(() => ({}))) as DiscountValidateResponse;

      // debug temporal
      console.log("DISCOUNTS/VALIDATE =>", data);

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

      const pct = Number(data?.percentage ?? 0);
      if (!Number.isFinite(pct) || pct <= 0) {
        throw new Error("El back no devolvió percentage válido.");
      }

      // ✅ fallback: si el back NO devuelve totals, calculamos para UI
      const subtotal = Number(totalPrice ?? 0);
      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        throw new Error("Subtotal inválido.");
      }

      let disc = Number(data?.discountAmount);
      if (!Number.isFinite(disc) || disc < 0) {
        disc = Math.round((subtotal * pct) / 100);
      }

      // ✅ cap para que nunca deje total en 0 (evita Stripe/DTO)
      const maxDiscount = Math.max(0, subtotal - 1);
      disc = Math.min(disc, maxDiscount);

      let final = Number(data?.finalTotal);
      if (!Number.isFinite(final)) {
        final = subtotal - disc;
      }

      if (final < 1) {
        setCouponApplied(null);
        showToast.error(
          `Cupón válido, pero el total quedaría en $0. Agrega más productos o usa menor %.`,
          {
            duration: 4000,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          },
        );
        return;
      }

      setCouponApplied({
        valid: true,
        code, // ✅ usamos el input como fuente si el back no manda code
        type: "PERCENT",
        value: pct,
        discountAmount: disc,
        finalTotal: final,
        message: data?.message,
      });

      showToast.success(`Cupón aplicado: -${pct}% ✅`, {
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
        productId: String(it.id ?? "").trim(),
        quantity: Number(it.quantity ?? 0),
      }))
      .filter((x) => x.productId && x.quantity > 0);

    if (!items.length) throw new Error("Tu carrito está vacío.");

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

    // ✅ bloqueo final
    if (couponApplied?.valid && totalFinal < 1) {
      showToast.error("El total final debe ser mínimo $1 para poder pagar.", {
        duration: 3500,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }

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

        <div className="flex items-center gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Tu Código aqui(ej: CFB59C9E)"
            className="min-w-0 flex-1 px-2 py-2 rounded-lg border-2 border-slate-900 text-xs outline-none placeholder:text-[10px]"
            disabled={isPaying}
            autoComplete="off"
          />

          {!couponApplied?.valid ? (
            <button
              onClick={applyCoupon}
              disabled={isPaying || isValidatingCoupon || isEmpty}
              className={`w-24 shrink-0 px-2 py-2 rounded-lg border-2 border-slate-900 text-xs font-bold transition ${
                isPaying || isValidatingCoupon || isEmpty
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-900 hover:bg-amber-900 text-amber-50"
              }`}
              title="Validar y aplicar cupón"
            >
              {isValidatingCoupon ? "Validando..." : "Aplicar"}
            </button>
          ) : (
            <button
              onClick={removeCoupon}
              disabled={isPaying}
              className={`w-24 shrink-0 px-2 py-2 rounded-lg border-2 border-slate-900 text-xs font-bold transition ${
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
              : "bg-emerald-900 hover:bg-amber-900 text-amber-50"
          }`}
          title="Checkout con Stripe"
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
          className="w-full text-center px-4 py-3 rounded-lg border-2 border-slate-900 font-bold bg-white transition-colors hover:bg-emerald-900"
        >
          Seguir comprando
        </Link>
      </div>
    </aside>
  );
}
