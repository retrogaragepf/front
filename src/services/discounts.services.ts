// src/services/discounts.services.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function assertApiBaseUrl(): string {
  if (!API_BASE_URL)
    throw new Error("NEXT_PUBLIC_API_BASE_URL no está definido.");
  return API_BASE_URL;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // JWT pelado
  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed?.token === "string") return parsed.token;
    if (typeof parsed?.dataUser?.token === "string")
      return parsed.dataUser.token;
    if (typeof parsed?.userSession?.token === "string")
      return parsed.userSession.token;

    return null;
  } catch {
    return null;
  }
}

export type DiscountDTO = {
  id: string;
  code: string;
  percentage: number;

  isActive: boolean;
  isUsed: boolean;

  // ✅ campos que YA devuelve el back en GET /discounts
  expiresAt?: string | null;
  usedAt?: string | null;
  usedByUserId?: string | null;
  createdAt?: string | null;
};

export async function createDiscountCode(
  payload: { percentage: number },
  tokenFromContext?: string | null,
) {
  const base = assertApiBaseUrl();
  const tokenFromStorage = getAuthToken();
  const token = tokenFromContext ?? tokenFromStorage;

  // ✅ DEBUG temporal
  console.log("createDiscountCode DEBUG", {
    base,
    tokenFromContext: tokenFromContext
      ? `${tokenFromContext.slice(0, 12)}...`
      : null,
    tokenFromStorage: tokenFromStorage
      ? `${tokenFromStorage.slice(0, 12)}...`
      : null,
    finalToken: token ? `${token.slice(0, 12)}...` : null,
    payload,
  });

  if (!token) {
    throw new Error("Unauthorized: no hay token guardado.");
  }

  const res = await fetch(`${base}/discounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  // ✅ DEBUG temporal
  console.log("createDiscountCode RESPONSE", {
    status: res.status,
    ok: res.ok,
    data,
  });

  if (!res.ok) {
    throw new Error(
      data?.message || "No se pudo generar el código de descuento.",
    );
  }

  return data as DiscountDTO;
}

/** ✅ traer listado de cupones generados */
export async function getDiscountCodes(tokenFromContext?: string | null) {
  const base = assertApiBaseUrl();
  const tokenFromStorage = getAuthToken();
  const token = tokenFromContext ?? tokenFromStorage;

  // ✅ DEBUG temporal
  console.log("getDiscountCodes DEBUG", {
    base,
    tokenFromContext: tokenFromContext
      ? `${tokenFromContext.slice(0, 12)}...`
      : null,
    tokenFromStorage: tokenFromStorage
      ? `${tokenFromStorage.slice(0, 12)}...`
      : null,
    finalToken: token ? `${token.slice(0, 12)}...` : null,
  });

  if (!token) {
    throw new Error("Unauthorized: no hay token guardado.");
  }

  const res = await fetch(`${base}/discounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  // ✅ DEBUG temporal
  console.log("getDiscountCodes RESPONSE", {
    status: res.status,
    ok: res.ok,
    data,
  });

  if (!res.ok) {
    throw new Error(
      data?.message || "No se pudo cargar el listado de cupones.",
    );
  }

  // ✅ Normaliza por si el back devuelve {items: []} o {data: []}
  const list =
    (Array.isArray(data) ? data : null) ??
    (Array.isArray((data as any)?.items) ? (data as any).items : null) ??
    (Array.isArray((data as any)?.data) ? (data as any).data : null) ??
    [];

  return list as DiscountDTO[];
}

/** ✅ Helper: estado “humano” (Válido / Usado / Expirado / Inactivo) */
export function computeDiscountStatus(d: DiscountDTO) {
  const now = Date.now();
  const expTs = d.expiresAt ? Date.parse(d.expiresAt) : NaN;
  const isExpired = Number.isFinite(expTs) ? expTs <= now : false;

  // prioridad: usado > expirado > inactivo > válido
  if (d.isUsed) return { label: "Usado", tone: "used" as const };
  if (isExpired) return { label: "Expirado", tone: "expired" as const };
  if (!d.isActive) return { label: "Inactivo", tone: "inactive" as const };
  return { label: "Válido", tone: "valid" as const };
}
