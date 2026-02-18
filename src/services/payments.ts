const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export type CheckoutItem = { productId: string; quantity: number };

const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

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

export async function createCheckoutSession(items: CheckoutItem[]) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "No se pudo iniciar el pago con Stripe.");
  }

  return data as { url: string; sessionId?: string };
}
