"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as ToastNotify from "nextjs-toast-notify";
import { useAuth } from "@/src/context/AuthContext";

type MyProduct = {
  id: string;
  title?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  imgUrl?: string;
  imageUrl?: string;
  image?: string;
  createdAt?: string;
  category?: any;
  era?: any;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  try {
    return isJson && text ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

function formatCOP(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("es-CO", { minimumFractionDigits: 0 });
}

function notify(
  msg: string,
  type: "success" | "error" | "warning" = "success",
) {
  const fn =
    (ToastNotify as any)?.showToast || (ToastNotify as any)?.default?.showToast;

  if (typeof fn === "function") fn(msg, type);
  else console.log(`[toast:${type}]`, msg);
}

// ✅ Fallback (compatibilidad). Fuente principal será dataUser?.token
function getAuthTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // JWT plano
  if (raw.includes(".") && raw.split(".").length === 3) return raw;

  // JSON { user, token }
  try {
    const obj = JSON.parse(raw);
    const t = obj?.token;
    if (typeof t === "string" && t.includes(".") && t.split(".").length === 3) {
      return t;
    }
  } catch {}

  return null;
}

function normalizeProduct(
  p: any,
): MyProduct & { imageUrl?: string; price?: number; stock?: number } {
  const imageUrl =
    p?.imageUrl ??
    p?.image ??
    p?.imgUrl ??
    p?.image_url ??
    (Array.isArray(p?.images)
      ? typeof p.images[0] === "string"
        ? p.images[0]
        : p.images[0]?.url
      : null) ??
    (Array.isArray(p?.imageUrls) ? p.imageUrls[0] : null) ??
    null;

  const price =
    typeof p?.price === "string"
      ? Number(p.price)
      : (p?.price as number | undefined);

  const stock =
    typeof p?.stock === "string"
      ? Number(p.stock)
      : (p?.stock as number | undefined);

  return {
    ...p,
    imageUrl: imageUrl ?? undefined,
    price: Number.isFinite(price) ? price : undefined,
    stock: Number.isFinite(stock) ? stock : undefined,
  };
}

export default function MyProductsPage() {
  const router = useRouter();

  // ✅ usa token desde AuthContext (memoria) para evitar race con localStorage
  const { dataUser, isAuth, isLoadingUser } = useAuth();

  const [items, setItems] = useState<
    (MyProduct & { imageUrl?: string; price?: number; stock?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  // (opcional) solo debug visual, no afecta lógica
  const rawStorage = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const fetchMyProducts = async (opts?: { silent?: boolean }) => {
    setLoading(true);

    try {
      // ✅ prioridad: token de contexto; fallback: localStorage
      const token = dataUser?.token ?? getAuthTokenFromStorage();

      if (!token) {
        if (!opts?.silent) {
          notify("Debes iniciar sesión para ver tus productos", "warning");
        }
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/products/my-products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await parseJsonSafe(res);

      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : data?.message
              ? Array.isArray(data.message)
                ? data.message.join(", ")
                : data.message
              : "No se pudieron cargar tus productos";

        if (res.status === 401 || res.status === 403) {
          if (!opts?.silent) {
            notify("Tu sesión expiró. Inicia sesión de nuevo.", "warning");
          }
          router.replace("/login");
          return;
        }

        if (!opts?.silent) notify(msg, "error");
        setItems([]);
        return;
      }

      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : [];

      setItems(list.map(normalizeProduct));
    } catch (err: any) {
      if (!opts?.silent) {
        notify(err?.message || "Error cargando tus productos", "error");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Carga principal SIN doble carga: espera hidratación del auth
  useEffect(() => {
    if (isLoadingUser) return;

    // Si terminó de cargar y NO hay auth ni token en storage, ahí sí redirige
    const fallbackToken = getAuthTokenFromStorage();
    const hasToken = Boolean(dataUser?.token || fallbackToken);

    if (!isAuth && !hasToken) {
      setLoading(false);
      notify("Debes iniciar sesión para entrar al dashboard", "warning");
      router.replace("/login");
      return;
    }

    fetchMyProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, dataUser?.token]);

  // ✅ Refrescar al volver con atrás/adelante (bfcache) y al volver a la pestaña
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !isLoadingUser && (isAuth || dataUser?.token)) {
        fetchMyProducts({ silent: true });
      }
    };

    const onVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        !isLoadingUser &&
        (isAuth || dataUser?.token)
      ) {
        fetchMyProducts({ silent: true });
      }
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingUser, isAuth, dataUser?.token]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-3xl text-amber-900 font-extrabold">
              Mis productos
            </h3>
            <p className="text-sm text-slate-700">
              Aquí ves solo los productos asociados a tu cuenta.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchMyProducts()}
              className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Actualizar
            </button>

            <Link
              href="/createProduct"
              className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              + Publicar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border-2 border-amber-900 bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-slate-700">Cargando tus productos…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border-2 border-amber-900 bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
            <p className="text-slate-700">
              No tienes productos todavía. Crea uno para que aparezca aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const title = p.title ?? "Sin título";
              const img = p.imageUrl;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border-2 border-slate-900 bg-amber-100 p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]"
                >
                  <div className="mb-3 overflow-hidden rounded-xl border-2 border-slate-900 bg-amber-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={title}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-slate-600">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <h3 className="font-display text-xl font-extrabold text-amber-900 line-clamp-1">
                    {title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-700 line-clamp-2">
                    {p.description || "—"}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">
                      ${formatCOP(p.price as number | undefined)}
                    </span>
                    <span className="text-slate-700">
                      Stock: <b className="text-slate-900">{p.stock ?? "—"}</b>
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/product/${p.id}`}
                      className="w-full text-center border-2 border-slate-900 bg-amber-400 px-3 py-2 text-sm font-semibold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:bg-amber-300 transition"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
