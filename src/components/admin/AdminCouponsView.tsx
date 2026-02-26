"use client";

import { useEffect, useMemo, useState } from "react";
import { showToast } from "nextjs-toast-notify";
import {
  createDiscountCode,
  getDiscountCodes,
  computeDiscountStatus,
  type DiscountDTO,
} from "@/src/services/discounts.services";
import { useAuth } from "@/src/context/AuthContext";

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

/** ✅ NUEVO (solo UI): resuelve email por userId vía GET /users/{id} con cache */
async function getUserEmailById(
  apiBaseUrl: string,
  token: string,
  userId: string,
): Promise<string | null> {
  const res = await fetch(`${apiBaseUrl}/users/${userId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data: any = await res.json();
  const email = data?.email ?? data?.user?.email ?? data?.data?.email ?? null;

  return typeof email === "string" && email.includes("@") ? email : null;
}

export default function AdminCouponsView() {
  const { dataUser, isLoadingUser, isAuth } = useAuth();

  const [percentage, setPercentage] = useState<number>(15);
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);

  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastPct, setLastPct] = useState<number | null>(null);

  const [couponList, setCouponList] = useState<DiscountDTO[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [couponListError, setCouponListError] = useState<string | null>(null);

  const [couponQuery, setCouponQuery] = useState("");
  const [onlyValidCoupons, setOnlyValidCoupons] = useState(false);

  /** ✅ NUEVO (solo UI): cache + loading por userId */
  const [emailByUserId, setEmailByUserId] = useState<Record<string, string>>(
    {},
  );
  const [loadingEmailById, setLoadingEmailById] = useState<
    Record<string, boolean>
  >({});

  const copyText = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast.success(successMsg, { duration: 1800 });
    } catch {
      showToast.error("No se pudo copiar al portapapeles", { duration: 1800 });
    }
  };

  const loadCoupons = async () => {
    if (isLoadingCoupons) return;

    if (isLoadingUser) {
      showToast.info("Cargando sesión... intenta de nuevo.", {
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

  useEffect(() => {
    // carga inicial al entrar
    void loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateDiscount = async () => {
    if (isCreatingDiscount) return;

    if (isLoadingUser) {
      showToast.info("Cargando sesión... intenta de nuevo.", {
        duration: 1800,
      });
      return;
    }
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
      } catch {}

      void loadCoupons();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error generando el cupón";
      showToast.error(msg, { duration: 2500 });
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

  const filteredCoupons = useMemo(() => {
    const q = couponQuery.trim().toLowerCase();
    return couponList
      .slice()
      .sort(
        (a, b) =>
          Date.parse(String(b.createdAt ?? "")) -
          Date.parse(String(a.createdAt ?? "")),
      )
      .filter((d) =>
        q
          ? String(d.code ?? "")
              .toLowerCase()
              .includes(q)
          : true,
      )
      .filter((d) =>
        onlyValidCoupons ? computeDiscountStatus(d).tone === "valid" : true,
      );
  }, [couponList, couponQuery, onlyValidCoupons]);

  /** ✅ NUEVO (solo UI): precarga emails de usedByUserId visibles */
  useEffect(() => {
    const token = dataUser?.token;
    if (!token) return;
    if (!filteredCoupons.length) return;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

    const ids = Array.from(
      new Set(
        filteredCoupons
          .map((d) => String(d.usedByUserId || "").trim())
          .filter(Boolean),
      ),
    );

    ids.forEach((id) => {
      if (emailByUserId[id]) return;
      if (loadingEmailById[id]) return;

      setLoadingEmailById((prev) => ({ ...prev, [id]: true }));

      getUserEmailById(apiBaseUrl, token, id)
        .then((email) => {
          if (email) setEmailByUserId((prev) => ({ ...prev, [id]: email }));
        })
        .finally(() => {
          setLoadingEmailById((prev) => ({ ...prev, [id]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCoupons, dataUser?.token]);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-900">Cupones</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Genera cupones, copia la plantilla y revisa el historial de cupones.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCoupons}
          className={`px-4 py-3 rounded-xl border-2 border-amber-900 font-bold transition ${
            isLoadingCoupons
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : "bg-white text-amber-900 hover:bg-amber-100"
          }`}
          disabled={isLoadingCoupons}
        >
          {isLoadingCoupons ? "Cargando..." : "Refrescar listado"}
        </button>
      </div>

      {/* ✅ Generar cupón + Acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-amber-900 bg-amber-100 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
          <h2 className="text-lg font-extrabold text-amber-900">Crear cupón</h2>

          <label className="block text-xs font-bold text-zinc-600 mt-3 mb-1">
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
            <div className="mt-4 rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-600 font-bold">Último cupón</p>
              <p className="text-base font-extrabold text-amber-900 break-all">
                {lastCode} {lastPct ? `(${lastPct}%)` : ""}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(lastCode, "Cupón copiado")}
                  className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 text-xs font-bold hover:bg-amber-100"
                >
                  Copiar cupón
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(couponMessage, "Mensaje completo copiado")
                  }
                  className="px-3 py-2 rounded-lg border-2 border-amber-900 bg-emerald-900 text-amber-50 text-xs font-bold hover:bg-amber-900"
                >
                  Copiar mensaje
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border-2 border-amber-900 bg-amber-50 p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
          <h2 className="text-lg font-extrabold text-amber-900">Plantilla</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Copia y pega este mensaje para compartir el cupón.
          </p>

          <textarea
            readOnly
            value={couponMessage}
            className="mt-3 w-full min-h-56 rounded-xl border-2 border-amber-900 bg-white p-4 text-sm text-zinc-800 outline-none resize-y"
          />
        </div>
      </div>

      {/* ✅ Listado */}
      <div className="rounded-2xl border-2 border-amber-900 bg- p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-extrabold text-amber-900">
            Historial de cupones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto">
            <input
              value={couponQuery}
              onChange={(e) => setCouponQuery(e.target.value)}
              placeholder="Buscar por código…"
              className="w-full md:w-56 px-3 py-2 rounded-lg border-2 border-amber-900 bg-white text-amber-900 font-bold outline-none"
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
              <span className="text-sm font-bold text-zinc-600">Mostrando</span>
              <span className="text-sm font-extrabold text-amber-900">
                {filteredCoupons.length}
              </span>
            </div>
          </div>
        </div>

        {couponListError ? (
          <div className="mt-3 rounded-xl border-2 border-rose-900 bg-rose-50 p-3">
            <p className="text-sm font-bold text-rose-900">{couponListError}</p>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border-2 border-amber-900 overflow-hidden">
          <div className="max-h-130 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-amber-100 border-b-2 border-amber-900">
                <tr className="text-left">
                  <th className="px-3 py-2 font-extrabold text-amber-900">
                    Código
                  </th>
                  <th className="px-3 py-2 font-extrabold text-amber-900">%</th>
                  <th className="px-3 py-2 font-extrabold text-amber-900">
                    Estado
                  </th>
                  <th className="px-3 py-2 font-extrabold text-amber-900">-</th>
                  <th className="px-3 py-2 font-extrabold text-amber-900">
                    Utilizado
                  </th>
                  <th className="px-3 py-2 font-extrabold text-amber-900">
                    Usuario
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

                    const usedById = d.usedByUserId || null;

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

                        {/* ✅ AJUSTADO: muestra email (fallback a UUID si no carga) */}
                        <td className="px-3 py-2 text-zinc-700 break-all">
                          {!usedById
                            ? "-"
                            : loadingEmailById[usedById]
                              ? "Cargando..."
                              : emailByUserId[usedById] || usedById}
                        </td>

                        <td className="px-3 py-2 text-zinc-700">
                          {toDateLabel(d.createdAt ?? null)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => copyText(d.code, "Cupón copiado")}
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

        {/* ✅ opcional: precargar emails si refrescás listado (no cambia lógica) */}
        <div className="hidden">{API_BASE_URL}</div>
      </div>
    </div>
  );
}
