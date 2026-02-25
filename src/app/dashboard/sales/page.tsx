"use client";

import { useEffect, useState } from "react";

type Venta = {
  id: string;
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  status: "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  order: {
    id: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name?: string;
      address?: string;
    };
  };
};

export default function SalesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);

  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

  const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

  const getToken = () => {
    if (typeof window === "undefined") return null;

    // ✅ probamos la key real del proyecto + fallback
    const keys = [TOKEN_KEY, "retrogarage_auth"];

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      console.log(`[SalesPage] localStorage ${k}:`, raw ? "OK" : "EMPTY");
      if (!raw) continue;

      // ✅ JWT pelado
      if (raw.startsWith("eyJ")) return raw;

      // ✅ JSON { token }
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.token === "string") return parsed.token;
      } catch {}
    }

    return null;
  };

  const fetchVentas = async () => {
    console.log("[SalesPage] fetchVentas() start. API =", API);

    const token = getToken();
    if (!token) {
      console.log("[SalesPage] No token => no se puede pedir ventas.");
      setAuthMissing(true);
      setLoading(false);
      return;
    }

    try {
      const url = `${API}/ventas/mis-ventas`;
      console.log("[SalesPage] GET", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("[SalesPage] Response status:", res.status);

      const text = await res.text();
      console.log("[SalesPage] Raw body:", text);

      let data: any = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      setVentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[SalesPage] Error cargando ventas:", err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (
    id: string,
    status: "SHIPPED" | "DELIVERED" | "CANCELLED",
  ) => {
    const token = getToken();
    if (!token) return;

    try {
      const url = `${API}/ventas/${id}/status`;
      console.log("[SalesPage] PATCH", url, "=>", status);

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const text = await res.text();
      console.log("[SalesPage] PATCH status:", res.status, "body:", text);

      if (!res.ok) {
        console.error("Error actualizando estado");
        return;
      }

      await fetchVentas();
    } catch (err) {
      console.error("Error en cambiarEstado:", err);
    }
  };

  useEffect(() => {
    fetchVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>Cargando ventas...</p>;

  if (authMissing) {
    return (
      <section style={{ padding: "2rem" }}>
        <h1>Mis ventas</h1>
        <p style={{ opacity: 0.8 }}>
          No hay sesión activa (token). Inicia sesión para ver tus ventas.
        </p>
      </section>
    );
  }

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Mis ventas</h1>

      {ventas.length === 0 && <p>No tenés ventas</p>}

      <ul style={{ display: "grid", gap: "1rem" }}>
        {ventas.map((venta) => (
          <li
            key={venta.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <h3>{venta.title}</h3>

            <p>
              <b>Comprador:</b>{" "}
              {venta.order.user.name ? (
                venta.order.user.name
              ) : (
                <span style={{ opacity: 0.7 }}>—</span>
              )}
            </p>

            <p>
              <b>Email:</b> {venta.order.user.email}
            </p>

            <p>
              <b>Dirección de envío:</b>{" "}
              {venta.order.user.address ? (
                venta.order.user.address
              ) : (
                <span style={{ opacity: 0.7 }}>—</span>
              )}
            </p>

            <p>
              <b>Fecha:</b>{" "}
              {new Date(venta.order.createdAt).toLocaleDateString()}
            </p>

            <p>
              <b>Cantidad:</b> {venta.quantity}
            </p>

            <p>
              <b>Total:</b> ${venta.subtotal}
            </p>

            <p>
              <b>Estado:</b> {venta.status}
            </p>

            {venta.status === "PAID" && (
              <button
                onClick={() => cambiarEstado(venta.id, "SHIPPED")}
                className="
                  mt-4
                  px-4 py-2
                  rounded-xl
                  border-2 border-zinc-900
                  bg-amber-300
                  font-bold
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  hover:bg-amber-400
                  active:translate-x-px
                  active:translate-y-px
                  transition-all
                "
              >
                Marcar como enviado
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
