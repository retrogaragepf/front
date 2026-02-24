// src/services/orders.services.ts

export type OrderStatus =
  | "pending"
  | "paid"
  | "approved"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | string;

export type OrderItemDTO = {
  id: string;
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  product?: {
    id: string;
    title: string;
    imgUrl?: string;
  };
};

export type OrderDTO = {
  id: string;
  total: number;
  status: OrderStatus;
  trackingCode?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItemDTO[];
};

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

/* 🔥 ÚNICO CAMBIO REAL ESTÁ ACÁ */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1️⃣ Intentar con la key principal (retrogarage_auth)
  const rawMain = localStorage.getItem(TOKEN_KEY);
  if (rawMain) {
    if (rawMain.startsWith("eyJ")) return rawMain;

    try {
      const parsed = JSON.parse(rawMain);
      if (typeof parsed?.token === "string") return parsed.token;
    } catch {}
  }

  // 2️⃣ Compatibilidad con la key que ya estás usando: userSesion
  const rawLegacy = localStorage.getItem("userSesion");
  if (rawLegacy) {
    try {
      const parsed = JSON.parse(rawLegacy);
      if (typeof parsed?.token === "string") return parsed.token;
    } catch {}
  }

  return null;
}

export async function getMyOrders(): Promise<OrderDTO[]> {
  const base = assertApiBaseUrl();
  const token = getAuthToken();

  if (!token) {
    throw new Error("No hay token. Inicia sesión para ver tus órdenes.");
  }

  const res = await fetch(`${base}/orders/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      `No se pudieron cargar tus órdenes (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  return Array.isArray(data) ? (data as OrderDTO[]) : [];
}

export async function getOrderById(id: string): Promise<OrderDTO> {
  const base = assertApiBaseUrl();
  const token = getAuthToken();

  if (!id) throw new Error("Falta el id de la orden.");
  if (!token) throw new Error("No hay token. Inicia sesión para ver tu orden.");

  const res = await fetch(`${base}/orders/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      `No se pudo cargar la orden (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  return data as OrderDTO;
}