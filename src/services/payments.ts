import type { CartItem } from "@/src/context/CartContext";

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;  VA    DENTRO D. ELA FUNCION PAAR EVITAR PRONLEMAS O ERRORES DE IMPORTACION EN EL SERVIDOR, YA QUE ESTE ARCHIVO SE EJECUTA TANTO EN EL SERVIDOR COMO EN EL CLIENTE

export async function createCheckoutSession(items: CartItem[]) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // ACA SE MOVIO
  if (!API_BASE_URL) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");

  const payload = {
    items: items.map((it) => ({
      id: it.id,
      title: it.title,
      price: Number(it.price),
      quantity: Number(it.quantity),
      image: it.image,
    })),
  };

  const res = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "No se pudo iniciar el pago con Stripe");
  }

  return data as { url: string };
}
