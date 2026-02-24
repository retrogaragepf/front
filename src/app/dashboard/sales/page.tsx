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
    };
  };
};

export default function SalesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  // 🔐 sacamos el token REAL
  const getToken = () => {
    const raw = localStorage.getItem("retrogarage_auth");
    if (!raw) return null;
    try {
      return JSON.parse(raw).token;
    } catch {
      return null;
    }
  };

  // 📦 traer ventas
  const fetchVentas = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/ventas/mis-ventas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setVentas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🚚 cambiar estado
  const cambiarEstado = async (
    id: string,
    status: "SHIPPED" | "DELIVERED" | "CANCELLED"
  ) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API}/ventas/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: status.toLowerCase() }),
    });

    // refrescamos lista
    fetchVentas();
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
              <b>Cliente:</b> {venta.order.user.email}
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
              >
                Marcar como enviado
              </button>
            )}

            {venta.status === "SHIPPED" && (
              <button
                onClick={() => cambiarEstado(venta.id, "DELIVERED")}
              >
                Marcar como entregado
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}