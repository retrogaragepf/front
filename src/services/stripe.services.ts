const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CheckoutItem = { productId: string; quantity: number };

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

  // JSON { token }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token === "string") return parsed.token;
  } catch {}

  return null;
}

export async function createCheckoutSession(items: CheckoutItem[]) {
  const baseUrl = assertApiBaseUrl();
  const token = getAuthToken();

  const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (data as any)?.message || "No se pudo iniciar el pago con Stripe.",
    );
  }

  return data as { url: string; sessionId?: string };
}
