"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";
import { useCart } from "@/src/context/CartContext";

export default function SuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart(); // ✅ carrito limpio tras pagar
    showToast.success("¡Pago aprobado! Estamos registrando tu orden.");
    const t = setTimeout(() => router.push("/dashboard/orders"), 1200);
    return () => clearTimeout(t);
  }, [clearCart, router]);

  return (
    <div className="min-h-screen bg-[#f5f2ea] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-amber-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <h1 className="font-display text-2xl text-amber-900 font-extrabold mb-2">
          Pago exitoso
        </h1>
        <p className="text-slate-800">
          Listo. Si tu orden no aparece de inmediato, espera unos segundos: el
          webhook la confirma.
        </p>
      </div>
    </div>
  );
}
