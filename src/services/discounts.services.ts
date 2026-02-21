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

  if (raw.startsWith("eyJ")) return raw;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === "string" ? parsed.token : null;
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
};

export async function createDiscountCode(payload: { percentage: number }) {
  const base = assertApiBaseUrl();
  const token = getAuthToken();

  const res = await fetch(`${base}/discounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload), // ✅ { percentage }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.message || "No se pudo generar el código de descuento.",
    );
  }

  return data as DiscountDTO; // { id, code, percentage, isActive, isUsed }
}
