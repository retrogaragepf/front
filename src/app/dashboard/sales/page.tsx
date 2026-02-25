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
      name?: string;
      email: string;
      address?: string;
    };
  };
};

export default function SalesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

  const getToken = () => {
    const raw = localStorage.getItem("retrogarage_auth");
    if (!raw) return null;

    // ✅ JWT pelado
    if (raw.startsWith("eyJ")) return raw;

    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  const fetchVentas = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ✅ Swagger: status es requerido (ej: PAID)
      const res = await fetch(`${API}/ventas/mis-ventas?status=PAID`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("VENTAS ACTUALIZADAS:", data);

      setVentas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando ventas:", err);
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
      console.log("CAMBIANDO ESTADO:", id, status);

      const res = await fetch(`${API}/ventas/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const text = await res.text();
      console.log("RESPUESTA PATCH:", res.status, text);

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
  }, []);

  if (loading) return <p>Cargando ventas...</p>;

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
                  active:translate-x-[1px]
                  active:translate-y-[1px]
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
