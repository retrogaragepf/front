// src/services/orders.services.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function assertApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL no está definido. Configúralo en .env.local (dev) o en Vercel (prod).",
    );
  }
  return API_BASE_URL;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // JWT pelado
  if (raw.startsWith("eyJ")) return raw;

  // JSON { user, token }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token === "string") return parsed.token;
  } catch {}

  return null;
}

// Ajusta esta interfaz a lo que te devuelva el back.
// La dejo flexible para que no te rompa TypeScript.
export type Order = {
  id?: string;
  status?: string; // paid / pending / cancelled ...
  total?: number;
  currency?: string;
  createdAt?: string;
  items?: Array<{
    productId?: string;
    title?: string;
    quantity?: number;
    price?: number;
    image?: string;
  }>;
  [key: string]: any;
};

export async function getMyOrders(): Promise<Order[]> {
  const base = assertApiBaseUrl();
  const token = getAuthToken();

  const res = await fetch(`${base}/orders/me`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "No se pudieron cargar tus órdenes.");
  }

  // algunos backs responden { orders: [...] }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;

  return [];
}
