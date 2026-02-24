type AnyRecord = Record<string, unknown>;

export type SimpleSaleStatus = "comprado" | "enviado" | "recibido";

export type AdminSaleRecord = {
  id: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  trackingCode: string;
  statusRaw: string;
  statusSimple: SimpleSaleStatus;
};

const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (!raw) throw new Error("NEXT_PUBLIC_API_BASE_URL no está configurado.");
  return raw.replace(/\/$/, "");
}

function getToken(): string | null {
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

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data;
  if (isRecord(data) && typeof data.message === "string") return data.message;
  return fallback;
}

function personFrom(value: unknown, fallbackName: string) {
  const row = asRecord(value);
  return {
    name:
      getString(row.name) ||
      getString(row.fullName) ||
      getString(row.username) ||
      getString(row.email) ||
      fallbackName,
    email: getString(row.email) || getString(row.mail) || "",
  };
}

function extractFirstItem(order: AnyRecord): AnyRecord {
  const items = getArray(order.items);
  return asRecord(items[0]);
}

function resolveStatus(rawStatus: string): SimpleSaleStatus {
  const normalized = rawStatus.toLowerCase().trim();
  if (
    [
      "shipped",
      "shipping",
      "in_transit",
      "in-transit",
      "enviado",
      "enviado_parcial",
    ].includes(normalized)
  ) {
    return "enviado";
  }
  if (
    [
      "delivered",
      "received",
      "completed",
      "recibido",
      "entregado",
      "fulfilled",
    ].includes(normalized)
  ) {
    return "recibido";
  }
  return "comprado";
}

function getSimpleStatusTarget(current: SimpleSaleStatus): SimpleSaleStatus {
  if (current === "comprado") return "enviado";
  if (current === "enviado") return "recibido";
  return "recibido";
}

function mapSimpleToBackendStatus(status: SimpleSaleStatus): string {
  if (status === "enviado") return "SHIPPED";
  if (status === "recibido") return "DELIVERED";
  return "PAID";
}

function buildStatusPathCandidates(id: string): string[] {
  const configured = process.env.NEXT_PUBLIC_ADMIN_ORDER_STATUS_ENDPOINTS
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((path) =>
      path.replace(":id", encodeURIComponent(id)).replace("{id}", encodeURIComponent(id)),
    );

  if (configured && configured.length > 0) return configured;

  return [
    `/ventas/${encodeURIComponent(id)}/status`,
    `/ventas/${encodeURIComponent(id)}`,
    `/orders/${encodeURIComponent(id)}/status`,
    `/orders/${encodeURIComponent(id)}`,
    `/admin/orders/${encodeURIComponent(id)}/status`,
    `/admin/orders/${encodeURIComponent(id)}`,
  ];
}

function getOrdersArray(data: unknown): AnyRecord[] {
  if (Array.isArray(data)) return data.map(asRecord);
  if (isRecord(data) && Array.isArray(data.orders)) return data.orders.map(asRecord);
  if (isRecord(data) && Array.isArray(data.data)) return data.data.map(asRecord);
  if (isRecord(data) && Array.isArray(data.results)) return data.results.map(asRecord);
  if (isRecord(data) && Array.isArray(data.sales)) return data.sales.map(asRecord);
  if (isRecord(data) && Array.isArray(data.ventas)) return data.ventas.map(asRecord);
  return [];
}

function normalizeOrder(orderInput: unknown): AdminSaleRecord {
  const row = asRecord(orderInput);
  const order = asRecord(row.order);
  const product = asRecord(row.product);
  const orderItem = extractFirstItem(order);

  const buyerRaw =
    order.user ??
    order.buyer ??
    order.customer ??
    order.buyerUser ??
    order.purchaser;
  const sellerRaw =
    product.user ??
    product.seller ??
    product.owner ??
    row.seller ??
    orderItem.seller;

  const buyer = personFrom(buyerRaw, "Comprador no disponible");
  const seller = personFrom(sellerRaw, "Vendedor no disponible");

  const statusRaw =
    getString(order.status) ||
    getString(row.status) ||
    "pending";
  const statusSimple = resolveStatus(statusRaw);
  const createdAt =
    getString(order.createdAt) ||
    getString(order.updatedAt) ||
    getString(row.createdAt) ||
    "";
  const productName =
    getString(row.title) ||
    getString(product.title) ||
    getString(orderItem.title) ||
    getString(product.title) ||
    getString(product.name) ||
    "Producto";

  const quantity = Math.max(1, getNumber(row.quantity || orderItem.quantity) || 1);
  const unitPrice = getNumber(row.unitPrice || orderItem.unitPrice || orderItem.price || product.price);
  const subtotal = getNumber(row.subtotal || orderItem.subtotal || unitPrice * quantity);
  const total = getNumber(order.total || subtotal || unitPrice * quantity);
  const trackingCode =
    getString(order.trackingCode) || getString(order.trackingNumber) || "";

  return {
    id: String(
      row.id ??
        row._id ??
        row.saleId ??
        order.id ??
        order._id ??
        order.orderId ??
        "",
    ),
    createdAt,
    buyerName: buyer.name,
    buyerEmail: buyer.email,
    sellerName: seller.name,
    sellerEmail: seller.email,
    productName,
    quantity,
    unitPrice,
    total,
    trackingCode,
    statusRaw,
    statusSimple,
  };
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const base = getApiBaseUrl();
  const token = getToken();
  if (!token) throw new Error("No hay token. Inicia sesión como admin.");

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = parseJsonSafe(text);

  return { ok: response.ok, status: response.status, data };
}

function getOrdersPathCandidates(): string[] {
  const configured = process.env.NEXT_PUBLIC_ADMIN_ORDERS_ENDPOINTS
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) return configured;

  return [
    "/ventas/admin/todas",
    "/ventas/mis-ventas",
    "/ventas",
    "/orders/me",
    "/orders/all",
    "/orders",
    "/admin/orders",
  ];
}

export const adminSalesService = {
  async getSalesRecords(): Promise<AdminSaleRecord[]> {
    const paths = getOrdersPathCandidates();
    const errorTrail: string[] = [];

    for (const path of paths) {
      const result = await request(path, { method: "GET" });
      if (result.ok) {
        const list = getOrdersArray(result.data);
        const normalized = list.map(normalizeOrder).filter((row) => Boolean(row.id));
        if (normalized.length > 0) return normalized;
        // Si responde 200 pero vacío, seguimos probando otros endpoints por compatibilidad.
        errorTrail.push(`${path}: vacío`);
        continue;
      }

      const msg = extractMessage(
        result.data,
        `HTTP ${result.status}`,
      );
      errorTrail.push(`${path}: ${msg}`);
    }

    const details = errorTrail.slice(0, 3).join(" | ");
    throw new Error(
      `No se pudieron cargar las compras/ventas. ${details || "Sin respuesta útil del backend."}`,
    );
  },

  async advanceStatus(record: AdminSaleRecord): Promise<SimpleSaleStatus> {
    const nextSimpleStatus = getSimpleStatusTarget(record.statusSimple);
    if (nextSimpleStatus === record.statusSimple) return record.statusSimple;

    const backendStatus = mapSimpleToBackendStatus(nextSimpleStatus);
    const paths = buildStatusPathCandidates(record.id);

    const bodies: string[] = [
      JSON.stringify({ status: backendStatus }),
      JSON.stringify({ status: backendStatus.toLowerCase() }),
      JSON.stringify({ orderStatus: backendStatus }),
      JSON.stringify({ state: backendStatus }),
      JSON.stringify({ status: nextSimpleStatus }),
      JSON.stringify({ status: nextSimpleStatus.toUpperCase() }),
      JSON.stringify({ status: nextSimpleStatus === "enviado" ? "ENVIADO" : "RECIBIDO" }),
    ];

    for (const path of paths) {
      for (const method of ["PATCH", "PUT"] as const) {
        for (const body of bodies) {
          const result = await request(path, { method, body });
          if (result.ok) return nextSimpleStatus;

          if ([401, 403].includes(result.status)) {
            throw new Error("No autorizado para actualizar el estado.");
          }
        }
      }
    }

    throw new Error(
      "No se pudo actualizar estado en backend. Revisa endpoint de órdenes admin.",
    );
  },
};
