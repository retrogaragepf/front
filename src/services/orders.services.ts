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

type AnyRecord = Record<string, unknown>;

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

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): AnyRecord {
  return isRecord(value) ? value : {};
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeItem(input: unknown, index: number): OrderItemDTO {
  const row = asRecord(input);
  const product = asRecord(row.product);

  const quantity = Math.max(1, getNumber(row.quantity) || 1);
  const unitPrice = getNumber(row.unitPrice ?? row.price);
  const subtotal = getNumber(row.subtotal || unitPrice * quantity);
  const id =
    getString(row.id) ||
    getString(row._id) ||
    getString(product.id) ||
    `${index}`;

  return {
    id,
    title:
      getString(row.title) || getString(product.title) || getString(product.name) || "Producto",
    unitPrice,
    quantity,
    subtotal,
    product: getString(product.id) || getString(product._id)
      ? {
          id: getString(product.id) || getString(product._id),
          title: getString(product.title) || getString(product.name),
          imgUrl: getString(product.imgUrl) || getString(product.image),
        }
      : undefined,
  };
}

function normalizeOrder(input: unknown): OrderDTO {
  const row = asRecord(input);
  const rawItems = Array.isArray(row.items) ? row.items : [];

  const id =
    getString(row.id) ||
    getString(row._id) ||
    getString(row.orderId) ||
    getString(row.uuid);
  const createdAt =
    getString(row.createdAt) ||
    getString(row.date) ||
    getString(row.created_at) ||
    new Date().toISOString();
  const status = getString(row.status) || "pending";

  return {
    id,
    total: getNumber(row.total),
    status,
    trackingCode:
      getString(row.trackingCode) || getString(row.trackingNumber) || null,
    stripeSessionId:
      getString(row.stripeSessionId) || getString(row.sessionId) || null,
    stripePaymentIntentId:
      getString(row.stripePaymentIntentId) || getString(row.paymentIntentId) || null,
    createdAt,
    updatedAt: getString(row.updatedAt) || undefined,
    items: rawItems.map(normalizeItem),
  };
}

function getOrdersArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function extractErrorMessage(data: unknown): string {
  const row = asRecord(data);
  const message = row.message;
  if (typeof message === "string" && message.trim()) return message;
  return "";
}

export async function getMyOrders(
  tokenFromCaller?: string,
): Promise<OrderDTO[]> {
  const base = assertApiBaseUrl();
  const token = tokenFromCaller ?? getAuthToken();

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
      extractErrorMessage(data) ||
      `No se pudieron cargar tus órdenes (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  return getOrdersArray(data)
    .map(normalizeOrder)
    .filter((order) => Boolean(order.id));
}

export async function getOrderById(
  id: string,
  tokenFromCaller?: string,
): Promise<OrderDTO> {
  const base = assertApiBaseUrl();
  const token = tokenFromCaller ?? getAuthToken();

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
      extractErrorMessage(data) ||
      `No se pudo cargar la orden (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  return normalizeOrder(data);
}