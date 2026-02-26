"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { showToast } from "nextjs-toast-notify";
import {
  createDiscountCode,
  getDiscountCodes,
  computeDiscountStatus,
  type DiscountDTO,
} from "@/src/services/discounts.services";
import { useAuth } from "@/src/context/AuthContext";
import { adminChatService } from "@/src/services/adminChat.services";

type Props = {
  children: ReactNode;
  section: "users" | "products" | "chats" | "sales" | "coupons";
  setSection: (s: "users" | "products" | "chats" | "sales" | "coupons") => void;
};

const ADMIN_READ_CHATS_STORAGE_KEY = "admin_read_chats";

function loadAdminReadMarkers(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADMIN_READ_CHATS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.entries(parsed).reduce<Record<string, number>>(
      (acc, [id, value]) => {
        const at = typeof value === "number" ? value : Number(value);
        if (id && Number.isFinite(at) && at > 0) acc[id] = at;
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
}

function hasPendingAdminChat(
  chat: {
    id: string;
    unreadCount: number;
    timestamp: string;
    lastMessage: string;
  },
  readMarkers: Record<string, number>,
): boolean {
  const hasActivity = Boolean(
    (chat.lastMessage || "").trim() || (chat.timestamp || "").trim(),
  );
  if (!hasActivity) return false;

  const readAt = readMarkers[chat.id] ?? 0;
  const chatTs = Date.parse(chat.timestamp || "");
  const hasValidTs = Number.isFinite(chatTs);

  if (!readAt) return true;
  if (chat.unreadCount > 0) {
    if (!hasValidTs) return true;
    return chatTs > readAt;
  }
  if (!hasValidTs) return false;
  return chatTs > readAt;
}

function toDateLabel(iso?: string | null) {
  if (!iso) return "-";
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return "-";
  return new Date(t).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const [hasPendingChats, setHasPendingChats] = useState(false);

  // ✅ NUEVO: listado cupones
  const [couponList, setCouponList] = useState<DiscountDTO[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [couponListError, setCouponListError] = useState<string | null>(null);

  // ✅ NUEVO: buscador + filtro
  const [couponQuery, setCouponQuery] = useState("");
  const [onlyValidCoupons, setOnlyValidCoupons] = useState(false);

  useEffect(() => {
    let canceled = false;

    const loadPendingChats = async () => {
      if (isLoadingUser || !isAuth || !dataUser?.token) {
        if (!canceled) setHasPendingChats(false);
        return;
      }

      try {
        const chats = await adminChatService.getConversations();
        if (canceled) return;
        const readMarkers = loadAdminReadMarkers();
        const pending = chats.some((chat) =>
          hasPendingAdminChat(chat, readMarkers),
        );
        setHasPendingChats(pending);
      } catch {
        if (!canceled) setHasPendingChats(false);
      }
    };

    void loadPendingChats();
    const intervalId = window.setInterval(() => {
      void loadPendingChats();
    }, 2_000);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [dataUser?.token, isAuth, isLoadingUser]);

  const loadCoupons = async () => {
    if (isLoadingCoupons) return;

    if (isLoadingUser) {
      showToast.info("Cargando sesión... intenta de nuevo en un momento.", {
        duration: 1800,
      });
      return;
    }

    if (!isAuth || !dataUser?.token) {
      showToast.error("Debes iniciar sesión como admin.", { duration: 2200 });
      return;
    }

    setIsLoadingCoupons(true);
    setCouponListError(null);

    try {
      const list = await getDiscountCodes(dataUser.token);
      setCouponList(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error cargando cupones";
      setCouponListError(msg);
      setCouponList([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // ✅ auto-carga cuando abrís el panel (no rompe nada)
  useEffect(() => {
    if (!isCouponPanelOpen) return;
    void loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCouponPanelOpen]);

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

      // ✅ refrescar listado si el panel está abierto
      if (isCouponPanelOpen) void loadCoupons();
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

  const filteredCoupons = useMemo(() => {
    const q = couponQuery.trim().toLowerCase();

    return couponList
      .slice()
      .sort((a, b) => {
        const ta = Date.parse(String(a.createdAt ?? ""));
        const tb = Date.parse(String(b.createdAt ?? ""));
        if (!Number.isFinite(tb) && !Number.isFinite(ta)) return 0;
        if (!Number.isFinite(tb)) return -1;
        if (!Number.isFinite(ta)) return 1;
        return tb - ta;
      })
      .filter((d) => {
        if (!q) return true;
        return String(d.code ?? "")
          .toLowerCase()
          .includes(q);
      })
      .filter((d) => {
        if (!onlyValidCoupons) return true;
        return computeDiscountStatus(d).tone === "valid";
      });
  }, [couponList, couponQuery, onlyValidCoupons]);

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
                : hasPendingChats
                  ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                  : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
            title="Abrir gestión de chats"
          >
            <span className="inline-flex items-center gap-2">
              Gestión de Chats
              {hasPendingChats && (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-700" />
              )}
            </span>
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
          <button
            onClick={() => setSection("coupons")}
            className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-extrabold text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] transition ${
              section === "coupons"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900 hover:bg-amber-100"
            }`}
          >
            Cupones
          </button>

          {/* ✅ Bloque cupón */}
          {/* <div className="mt-2 px-4 py-4 rounded-xl border-2 border-amber-900 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-extrabold text-amber-900">
                Crear cupón de descuento
              </p>

              <button
                type="button"
                onClick={() => setIsCouponPanelOpen(true)}
                className="px-2 py-1 rounded-md border border-amber-900 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                title="Abrir plantilla + listado"
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
          </div> */}
        </nav>

        <div className="mt-auto pt-10 text-sm text-zinc-500">
          RetroGarage™ Admin
        </div>
      </aside>

      {/* Navegación móvil admin */}
      <div className="md:hidden fixed left-0 right-0 top-16 z-30 border-b-2 border-amber-900 bg-amber-100/95 backdrop-blur px-2 py-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSection("users")}
            className={`px-3 py-2 rounded-lg border-2 border-amber-900 text-xs font-extrabold ${
              section === "users"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setSection("products")}
            className={`px-3 py-2 rounded-lg border-2 border-amber-900 text-xs font-extrabold ${
              section === "products"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setSection("chats")}
            className={`px-3 py-2 rounded-lg border-2 border-amber-900 text-xs font-extrabold ${
              section === "chats"
                ? "bg-amber-200 text-amber-900"
                : hasPendingChats
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-white text-amber-900"
            }`}
            title="Abrir gestión de chats"
          >
            <span className="inline-flex items-center gap-2">
              Chats
              {hasPendingChats && (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-700" />
              )}
            </span>
          </button>
          <button
            onClick={() => setSection("sales")}
            className={`px-3 py-2 rounded-lg border-2 border-amber-900 text-xs font-extrabold ${
              section === "sales"
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            Ventas
          </button>
        </div>
      </div>

      {/* Contenido normal (NO se toca) */}
      <main className="flex-1 p-10 md:p-10 pt-28 md:pt-10">{children}</main>

      {/* ✅ Panel derecho / modal flotante de cupones */}
      {isCouponPanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/35 z-40"
            onClick={() => setIsCouponPanelOpen(false)}
          />

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

            {/* ✅ LISTADO + BUSCADOR + SOLO VÁLIDOS + COPIAR */}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold text-amber-900">
                  Cupones generados
                </h3>

                <button
                  type="button"
                  onClick={loadCoupons}
                  className={`px-3 py-2 rounded-lg border-2 border-amber-900 font-bold ${
                    isLoadingCoupons
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "bg-white text-amber-900 hover:bg-amber-100"
                  }`}
                  disabled={isLoadingCoupons}
                >
                  {isLoadingCoupons ? "Cargando..." : "Refrescar"}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={couponQuery}
                  onChange={(e) => setCouponQuery(e.target.value)}
                  placeholder="Buscar por código…"
                  className="w-full px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 font-bold outline-none"
                />

                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-amber-900 bg-amber-50">
                  <input
                    type="checkbox"
                    checked={onlyValidCoupons}
                    onChange={(e) => setOnlyValidCoupons(e.target.checked)}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <span className="text-sm font-extrabold text-amber-900">
                    Solo válidos
                  </span>
                </label>

                <div className="flex items-center justify-between px-3 py-2 rounded-lg border-2 border-amber-900 bg-white">
                  <span className="text-sm font-bold text-zinc-600">
                    Mostrando
                  </span>
                  <span className="text-sm font-extrabold text-amber-900">
                    {filteredCoupons.length}
                  </span>
                </div>
              </div>

              {couponListError ? (
                <div className="mt-3 rounded-xl border-2 border-rose-900 bg-rose-50 p-3">
                  <p className="text-sm font-bold text-rose-900">
                    {couponListError}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border-2 border-amber-900 overflow-hidden bg-white">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-amber-100 border-b-2 border-amber-900">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Código
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          %
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Estado
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Expira
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Usado
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Usado por
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Creado
                        </th>
                        <th className="px-3 py-2 font-extrabold text-amber-900">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {isLoadingCoupons ? (
                        <tr>
                          <td className="px-3 py-3 text-zinc-600" colSpan={8}>
                            Cargando cupones...
                          </td>
                        </tr>
                      ) : filteredCoupons.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-zinc-600" colSpan={8}>
                            No hay cupones para mostrar.
                          </td>
                        </tr>
                      ) : (
                        filteredCoupons.map((d) => {
                          const st = computeDiscountStatus(d);

                          const badge =
                            st.tone === "valid"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-900"
                              : st.tone === "used"
                                ? "bg-amber-100 text-amber-900 border-amber-900"
                                : st.tone === "expired"
                                  ? "bg-rose-100 text-rose-900 border-rose-900"
                                  : "bg-zinc-100 text-zinc-700 border-zinc-700";

                          return (
                            <tr key={d.id} className="border-b border-zinc-100">
                              <td className="px-3 py-2 font-extrabold text-amber-900 break-all">
                                {d.code}
                              </td>
                              <td className="px-3 py-2 text-zinc-800 font-bold">
                                {d.percentage}%
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-extrabold ${badge}`}
                                >
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-zinc-700">
                                {toDateLabel(d.expiresAt ?? null)}
                              </td>
                              <td className="px-3 py-2 text-zinc-700 font-bold">
                                {d.isUsed ? "Sí" : "No"}
                                {d.usedAt ? ` (${toDateLabel(d.usedAt)})` : ""}
                              </td>
                              <td className="px-3 py-2 text-zinc-700 break-all">
                                {d.usedByUserId || "-"}
                              </td>
                              <td className="px-3 py-2 text-zinc-700">
                                {toDateLabel(d.createdAt ?? null)}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(d.code, "Cupón copiado")
                                  }
                                  className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 text-xs font-bold hover:bg-amber-100"
                                >
                                  Copiar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
