const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type CheckoutItem = { productId: string; quantity: number };

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

  // Si ya es un JWT pelado
  if (raw.startsWith("eyJ")) return raw;

  // Si es JSON con forma { user, token }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token === "string") return parsed.token;
  } catch {}

  return null;
}

// ✅ CAMBIO: agrega couponCode opcional
export async function createCheckoutSession(
  items: CheckoutItem[],
  couponCode?: string,
) {
  const token = getAuthToken();
  const baseUrl = assertApiBaseUrl();

  const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // ✅ CAMBIO: manda couponCode
    body: JSON.stringify({ items, couponCode }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (data as any)?.message || "No se pudo iniciar el pago con Stripe.",
    );
  }

  return data as { url: string; sessionId?: string };
}

