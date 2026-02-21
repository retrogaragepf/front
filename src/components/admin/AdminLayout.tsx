"use client";

import { ReactNode, useState } from "react";
import { showToast } from "nextjs-toast-notify";
import { createDiscountCode } from "@/src/services/discounts.services";

type Props = {
  children: ReactNode;
  section: "users" | "products";
  setSection: (s: "users" | "products") => void;
};

export default function AdminLayout({ children, section, setSection }: Props) {
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);

  // ✅ porcentaje seleccionable
  const [percentage, setPercentage] = useState<number>(15);

  // ✅ último cupón visible
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastPct, setLastPct] = useState<number | null>(null);

  const onCreateDiscount = async () => {
    if (isCreatingDiscount) return;

    const pct = Number(percentage);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      showToast.error("Porcentaje inválido. Usa un valor entre 1 y 100.", {
        duration: 2500,
      });
      return;
    }

    setIsCreatingDiscount(true);

    try {
      const res = await createDiscountCode({ percentage: pct });

      const code = String(res?.code ?? "").trim();
      const resPct = Number(res?.percentage ?? pct);

      if (!code) throw new Error("El back no devolvió el code del cupón.");

      setLastCode(code);
      setLastPct(Number.isFinite(resPct) && resPct > 0 ? resPct : pct);

      showToast.success(`Cupón generado: ${code} (${resPct || pct}%)`, {
        duration: 2500,
      });

      // ✅ copiar al portapapeles
      try {
        await navigator.clipboard.writeText(code);
        showToast.info("Copiado al portapapeles", { duration: 1800 });
      } catch {
        // ignore
      }
    } catch (e: any) {
      showToast.error(e?.message || "Error generando el cupón", {
        duration: 2500,
      });
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-amber-100]">
      {/* Sidebar */}
      <aside className="w-72 bg-amber-100 -r-2 border-amber-900 p-8 flex flex-col shadow-[6px_0px_0px_0px_rgba(0,0,0,0.85)]">
        <h2 className="font-display text-2xl text-amber-900 font-extrabold mb-10">
          Panel de Administración
        </h2>

        <nav className="flex flex-col gap-4">
          <button
            onClick={() => setSection("users")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "users"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Usuarios Registrados
          </button>

          <button
            onClick={() => setSection("products")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "products"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Validacion Productos
          </button>

          {/* ✅ Bloque cupón */}
          <div className="mt-2 px-4 py-4 rounded-xl border-2 border-amber-900 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-sm font-extrabold text-amber-900 mb-2">
              Crear cupón de descuento
            </p>

            <label className="block text-xs font-bold text-zinc-600 mb-1">
              Porcentaje (%)
            </label>

            <input
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border-2 border-amber-900 font-extrabold text-amber-900 outline-none"
            />

            <button
              onClick={onCreateDiscount}
              disabled={isCreatingDiscount}
              className={`mt-3 w-full px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
                isCreatingDiscount
                  ? "bg-zinc-200 text-zinc-700 opacity-70 cursor-not-allowed"
                  : "bg-emerald-200 text-emerald-950 hover:bg-emerald-300"
              }`}
            >
              {isCreatingDiscount ? "Generando..." : "Generar cupón"}
            </button>

            {lastCode ? (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <p className="text-xs text-zinc-600 font-bold">Último cupón</p>
                <p className="text-base font-extrabold text-amber-900">
                  {lastCode}
                  {lastPct ? ` (${lastPct}%)` : ""}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  (Se copió al portapapeles)
                </p>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="mt-auto pt-10 text-sm text-zinc-500">
          RetroGarage™ Admin
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
