"use client";

import { ReactNode, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { showToast } from "nextjs-toast-notify";
import { createDiscountCode } from "@/src/services/discounts.services";
import { useAuth } from "@/src/context/AuthContext";

type Props = {
  children: ReactNode;
  section: "users" | "products" | "chats" | "sales";
  setSection: (s: "users" | "products" | "chats" | "sales") => void;
};

export default function AdminLayout({
  children,
  section,
  setSection,
}: Props): ReactElement {
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const { dataUser, isLoadingUser, isAuth } = useAuth();

  // ✅ porcentaje seleccionable
  const [percentage, setPercentage] = useState<number>(15);

  // ✅ último cupón visible
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastPct, setLastPct] = useState<number | null>(null);

  // ✅ panel lateral/modal de cupones (NO reemplaza children)
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);

  const onCreateDiscount = async () => {
    if (isCreatingDiscount) return;

    // ✅ evita disparar antes de hidratar auth
    if (isLoadingUser) {
      showToast.info("Cargando sesión... intenta de nuevo en un momento.", {
        duration: 1800,
      });
      return;
    }

    // ✅ evita request sin sesión
    if (!isAuth || !dataUser?.token) {
      showToast.error("Debes iniciar sesión como admin para generar cupones.", {
        duration: 2500,
      });
      return;
    }

    const pct = Number(percentage);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      showToast.error("Porcentaje inválido. Usa un valor entre 1 y 100.", {
        duration: 2500,
      });
      return;
    }

    setIsCreatingDiscount(true);

    try {
      // ✅ pasa token directo (ver cambio en service abajo)
      const res = await createDiscountCode({ percentage: pct }, dataUser.token);

      const code = String(res?.code ?? "").trim();
      const resPct = Number(res?.percentage ?? pct);

      if (!code) throw new Error("El back no devolvió el code del cupón.");

      setLastCode(code);
      setLastPct(Number.isFinite(resPct) && resPct > 0 ? resPct : pct);

      showToast.success(`Cupón generado: ${code} (${resPct || pct}%)`, {
        duration: 2500,
      });

      try {
        await navigator.clipboard.writeText(code);
        showToast.info("Cupón copiado al portapapeles", { duration: 1800 });
      } catch {
        // ignore
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error generando el cupón";
      showToast.error(msg, {
        duration: 2500,
      });
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  const couponMessage = useMemo(() => {
    const pct = Number(lastPct ?? percentage);
    const code = String(lastCode ?? "").trim();

    return `🎉 ¡Tienes un cupón de descuento en RetroGarage™!

Usa el código: ${code || "[CUPON_AQUI]"}
Descuento: ${pct}% OFF

✅ Cómo usarlo:
1. Agrega tus productos al carrito
2. Ve al checkout
3. Ingresa el cupón en el campo de descuento
4. Aplica el código y finaliza tu compra

⏳ Sujeto a disponibilidad de productos.
Gracias por comprar en RetroGarage™ 🛍️`;
  }, [lastCode, lastPct, percentage]);

  const copyText = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast.success(successMsg, { duration: 1800 });
    } catch {
      showToast.error("No se pudo copiar al portapapeles", { duration: 1800 });
    }
  };

  return (
    <div className="min-h-screen flex bg-amber-100 relative">
      {/* Sidebar */}
      <aside className="w-72 bg-amber-100 border-r-2 border-amber-900 p-8 flex flex-col shadow-[6px_0px_0px_0px_rgba(0,0,0,0.85)]">
        <h3 className="font-display text-2xl text-amber-900 font-extrabold mb-10">
          Panel de Administración
        </h3>

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

          <button
            onClick={() => setSection("chats")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "chats"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Gestión de Chats
          </button>

          <button
            onClick={() => setSection("sales")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "sales"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Compras y Ventas
          </button>

          {/* ✅ Bloque cupón */}
          <div className="mt-2 px-4 py-4 rounded-xl border-2 border-amber-900 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-extrabold text-amber-900">
                Crear cupón de descuento
              </p>

              <button
                type="button"
                onClick={() => setIsCouponPanelOpen(true)}
                className="px-2 py-1 rounded-md border border-amber-900 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                title="Abrir plantilla de mensaje"
              >
                Abrir panel
              </button>
            </div>

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
              disabled={isCreatingDiscount || isLoadingUser || !isAuth}
              className={`mt-3 w-full px-4 py-3 rounded-xl border-2 border-amber-900 font-bold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
                isCreatingDiscount || isLoadingUser || !isAuth
                  ? "bg-zinc-200 text-zinc-700 opacity-70 cursor-not-allowed"
                  : "bg-emerald-900 text-amber-50 hover:bg-amber-900"
              }`}
            >
              {isLoadingUser
                ? "Cargando sesión..."
                : isCreatingDiscount
                  ? "Generando..."
                  : "Generar cupón"}
            </button>

            {lastCode ? (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <p className="text-xs text-zinc-600 font-bold">Último cupón</p>
                <p className="text-base font-extrabold text-amber-900 break-all">
                  {lastCode}
                  {lastPct ? ` (${lastPct}%)` : ""}
                </p>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(lastCode, "Cupón copiado al portapapeles")
                    }
                    className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 text-xs font-bold hover:bg-amber-100"
                  >
                    Copiar cupón
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCouponPanelOpen(true)}
                    className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200"
                  >
                    Ver plantilla
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="mt-auto pt-10 text-sm text-zinc-500">
          RetroGarage™ Admin
        </div>
      </aside>

      {/* Contenido normal (NO se toca) */}
      <main className="flex-1 p-10">{children}</main>

      {/* ✅ Panel derecho / modal flotante de cupones (no rompe auth) */}
      {isCouponPanelOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/35 z-40"
            onClick={() => setIsCouponPanelOpen(false)}
          />

          {/* panel */}
          <aside className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l-2 border-amber-900 shadow-[-8px_0px_0px_0px_rgba(0,0,0,0.85)] z-50 p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-amber-900">
                  Plantilla para compartir cupón
                </h2>
                <p className="text-sm text-zinc-600 mt-1">
                  Copia el mensaje completo y pégalo directamente para enviarlo
                  a usuarios.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCouponPanelOpen(false)}
                className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 font-bold hover:bg-amber-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border-2 border-amber-900 bg-amber-50 p-4">
                <p className="text-xs font-bold text-zinc-600 mb-1">
                  CUPÓN ACTUAL
                </p>
                <p className="text-xl font-extrabold text-amber-900 break-all">
                  {lastCode || "Aún no has generado un cupón"}
                </p>
                <p className="text-sm text-zinc-700 mt-1">
                  Descuento:{" "}
                  <span className="font-bold">{lastPct ?? percentage}%</span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        String(lastCode ?? "").trim(),
                        "Cupón copiado correctamente",
                      )
                    }
                    disabled={!lastCode}
                    className={`px-4 py-2 rounded-lg border-2 border-amber-900 font-bold ${
                      lastCode
                        ? "bg-white text-amber-900 hover:bg-amber-100"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    Copiar cupón
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        couponMessage,
                        "Mensaje completo copiado correctamente",
                      )
                    }
                    disabled={!lastCode}
                    className={`px-4 py-2 rounded-lg border-2 border-amber-900 font-bold ${
                      lastCode
                        ? "bg-emerald-900 text-amber-50 hover:bg-amber-900"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    Copiar mensaje
                  </button>
                </div>
              </div>

              <div className="rounded-xl border-2 border-amber-900 bg-white p-4">
                <p className="text-xs font-bold text-zinc-600 mb-2">RESUMEN</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b pb-2">
                    <span className="text-zinc-600">Código</span>
                    <span className="font-extrabold text-amber-900 break-all text-right">
                      {lastCode || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b pb-2">
                    <span className="text-zinc-600">Porcentaje</span>
                    <span className="font-extrabold text-amber-900">
                      {lastPct ?? percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-600">Estado</span>
                    <span className="font-extrabold text-emerald-700">
                      {lastCode ? "Listo para compartir" : "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-extrabold text-amber-900 mb-2">
                Mensaje listo para copiar y pegar
              </p>

              <textarea
                readOnly
                value={couponMessage}
                className="w-full min-h-70 rounded-xl border-2 border-amber-900 bg-amber-50 p-4 text-sm text-zinc-800 outline-none resize-y"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(couponMessage, "Plantilla completa copiada")
                }
                disabled={!lastCode}
                className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-bold transition ${
                  lastCode
                    ? "bg-emerald-900 text-amber-50 hover:bg-amber-900"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}
              >
                Copiar plantilla completa
              </button>

              <button
                type="button"
                onClick={() => setIsCouponPanelOpen(false)}
                className="px-4 py-3 rounded-xl border-2 border-amber-900 font-bold bg-white text-amber-900 hover:bg-amber-100 transition"
              >
                Cerrar panel
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
