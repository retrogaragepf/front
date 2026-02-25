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

/**
 * Crea la sesión de Stripe. Envía items + código opcional.
 * ✅ Enviamos varios aliases del código (couponCode/code/discountCode)
 * para evitar mismatch con el back mientras se alinea el DTO.
 */
export async function createCheckoutSession(
  items: CheckoutItem[],
  couponCode?: string,
) {
  const token = getAuthToken();
  const baseUrl = assertApiBaseUrl();

  const payload: any = { items };

  const code = couponCode?.trim();
  if (code) {
    payload.couponCode = code; // tu nombre original
    payload.code = code; // alias común
    payload.discountCode = code; // alias común
  }

  const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = String((data as any)?.message ?? "");

    // ✅ 401 / Unauthorized: mensaje amigable
    if (res.status === 401 || msg.toLowerCase().includes("unauthorized")) {
      throw new Error("Necesitas registrarte primero");
    }

    throw new Error(msg || "No se pudo iniciar el pago con Stripe.");
  }

  return data as { url: string; sessionId?: string };
}
