// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// type Venta = {
//   id: string;
//   title: string;
//   unitPrice: number;
//   quantity: number;
//   subtotal: number;
//   status: "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
//   order: {
//     id: string;
//     createdAt: string;
//     user: {
//       id: string;
//       email: string;
//       name?: string;
//       address?: string;
//     };
//   };
// };

// export default function SalesPage() {
//   const [ventas, setVentas] = useState<Venta[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [authMissing, setAuthMissing] = useState(false);
//   const router = useRouter();

//   const API =
//     process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-0o27.onrender.com";

//   const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

//   const getToken = () => {
//     if (typeof window === "undefined") return null;

//     // ✅ probamos la key real del proyecto + fallback
//     const keys = [TOKEN_KEY, "retrogarage_auth"];

//     for (const k of keys) {
//       const raw = localStorage.getItem(k);
//       console.log(`[SalesPage] localStorage ${k}:`, raw ? "OK" : "EMPTY");
//       if (!raw) continue;

//       // ✅ JWT pelado
//       if (raw.startsWith("eyJ")) return raw;

//       // ✅ JSON { token }
//       try {
//         const parsed = JSON.parse(raw);
//         if (typeof parsed?.token === "string") return parsed.token;
//       } catch {}
//     }

//     return null;
//   };

//   const fetchVentas = async () => {
//     console.log("[SalesPage] fetchVentas() start. API =", API);

//     const token = getToken();
//     if (!token) {
//       console.log("[SalesPage] No token => no se puede pedir ventas.");
//       setAuthMissing(true);
//       setLoading(false);
//       return;
//     }

//     try {
//       const url = `${API}/ventas/mis-ventas`;
//       console.log("[SalesPage] GET", url);

//       const res = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("[SalesPage] Response status:", res.status);

//       const text = await res.text();
//       console.log("[SalesPage] Raw body:", text);

//       let data: any = [];
//       try {
//         data = text ? JSON.parse(text) : [];
//       } catch {
//         data = [];
//       }

//       setVentas(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("[SalesPage] Error cargando ventas:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cambiarEstado = async (
//     id: string,
//     status: "SHIPPED" | "DELIVERED" | "CANCELLED",
//   ) => {
//     const token = getToken();
//     if (!token) return;

//     try {
//       const url = `${API}/ventas/${id}/status`;
//       console.log("[SalesPage] PATCH", url, "=>", status);

//       const res = await fetch(url, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ status }),
//       });

//       const text = await res.text();
//       console.log("[SalesPage] PATCH status:", res.status, "body:", text);

//       if (!res.ok) {
//         console.error("Error actualizando estado");
//         return;
//       }

//       await fetchVentas();
//     } catch (err) {
//       console.error("Error en cambiarEstado:", err);
//     }
//   };

//   useEffect(() => {
//     fetchVentas();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   if (loading) return <p>Cargando ventas...</p>;

//   if (authMissing) {
//     return (
//       <section style={{ padding: "2rem" }}>
//         <h1>Mis ventas</h1>
//         <p style={{ opacity: 0.8 }}>
//           No hay sesión activa (token). Inicia sesión para ver tus ventas.
//         </p>
//       </section>
//     );
//   }

//   return (
//     <section style={{ padding: "2rem" }}>
//       <div className="flex items-center justify-between gap-4">
//         <h1 className="text-2xl font-black">Mis ventas</h1>

//         <button
//           type="button"
//           onClick={() => router.back()}
//           className="shrink-0 px-2 py-1 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
//         >
//           Atrás
//         </button>
//       </div>

//       {ventas.length === 0 && <p>No tenés ventas</p>}

//       <ul style={{ display: "grid", gap: "1rem" }}>
//         {ventas.map((venta) => (
//           <li
//             key={venta.id}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "1rem",
//             }}
//           >
//             <h3>{venta.title}</h3>

//             <p>
//               <b>Comprador:</b>{" "}
//               {venta.order.user.name ? (
//                 venta.order.user.name
//               ) : (
//                 <span style={{ opacity: 0.7 }}>—</span>
//               )}
//             </p>

//             <p>
//               <b>Email:</b> {venta.order.user.email}
//             </p>

//             <p>
//               <b>Dirección de envío:</b>{" "}
//               {venta.order.user.address ? (
//                 venta.order.user.address
//               ) : (
//                 <span style={{ opacity: 0.7 }}>—</span>
//               )}
//             </p>

//             <p>
//               <b>Fecha:</b>{" "}
//               {new Date(venta.order.createdAt).toLocaleDateString()}
//             </p>

//             <p>
//               <b>Cantidad:</b> {venta.quantity}
//             </p>

//             <p>
//               <b>Total:</b> ${venta.subtotal}
//             </p>

//             <p>
//               <b>Estado:</b> {venta.status}
//             </p>

//             {venta.status === "PAID" && (
//               <button
//                 onClick={() => cambiarEstado(venta.id, "SHIPPED")}
//                 className="
//                   mt-4
//                   px-4 py-2
//                   rounded-xl
//                   border-2 border-zinc-900
//                   bg-amber-300
//                   font-bold
//                   shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
//                   hover:bg-amber-400
//                   active:translate-x-px
//                   active:translate-y-px
//                   transition-all
//                 "
//               >
//                 Marcar como enviado
//               </button>
//             )}
//           </li>
//         ))}
//       </ul>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function traducirEstado(status: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "Pago confirmado";
    case "SHIPPED":
      return "Enviado";
    case "DELIVERED":
      return "Entregado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function statusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "SHIPPED":
      return "bg-sky-100 text-sky-900 border-sky-300";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "CANCELLED":
      return "bg-rose-100 text-rose-900 border-rose-300";
    default:
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
  }
}

export default function SalesPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-100">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <p>Cargando ventas...</p>
        </div>
      </div>
    );
  }

  if (authMissing) {
    return (
      <div className="min-h-screen bg-amber-100">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
                Mis ventas
              </h1>
              <p className="text-zinc-700 mt-2">
                No hay sesión activa (token). Inicia sesión para ver tus ventas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
            >
              Atrás
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
              Mis ventas
            </h1>
            <p className="text-zinc-700 mt-2">
              Aquí ves tus ventas, comprador, envío y estado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-100 hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] active:translate-x-px active:translate-y-px"
          >
            Atrás
          </button>
        </div>

        {ventas.length === 0 && <p className="mt-6">No tenés ventas</p>}

        {ventas.length > 0 && (
          <div className="mt-8 space-y-6">
            {ventas.map((venta) => (
              <div
                key={venta.id}
                className="rounded-2xl border-2 border-zinc-900 bg-amber-200 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-zinc-900 font-black">
                        {venta.title}
                      </h3>

                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full border ${statusBadge(
                          venta.status,
                        )}`}
                      >
                        {traducirEstado(venta.status)}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-700 mt-2">
                      Venta realizada el{" "}
                      <span className="font-semibold">
                        {formatDate(venta.order.createdAt)}
                      </span>
                    </p>

                    <div className="mt-4 rounded-xl border border-zinc-900/25 bg-white/60 p-3 space-y-2">
                      <p className="text-sm text-zinc-800">
                        <span className="font-semibold">Comprador:</span>{" "}
                        {venta.order.user.name ? (
                          <span className="break-words">
                            {venta.order.user.name}
                          </span>
                        ) : (
                          <span className="opacity-70">—</span>
                        )}
                      </p>

                      <p className="text-sm text-zinc-800">
                        <span className="font-semibold">Email:</span>{" "}
                        <span className="break-all">
                          {venta.order.user.email}
                        </span>
                      </p>

                      <p className="text-sm text-zinc-800">
                        <span className="font-semibold">
                          Dirección de envío:
                        </span>{" "}
                        {venta.order.user.address ? (
                          <span className="break-words">
                            {venta.order.user.address}
                          </span>
                        ) : (
                          <span className="opacity-70">—</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-zinc-700">Total</p>
                    <p className="text-2xl font-black text-zinc-900">
                      ${Number(venta.subtotal || 0).toLocaleString("es-AR")}
                    </p>

                    <p className="text-sm text-zinc-700 mt-2">
                      Cantidad:{" "}
                      <span className="font-semibold">{venta.quantity}</span>
                    </p>

                    {venta.status === "PAID" && (
                      <div className="mt-3">
                        <button
                          onClick={() => cambiarEstado(venta.id, "SHIPPED")}
                          className="inline-block px-4 py-2 rounded-xl border-2 border-zinc-900 bg-amber-300 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:bg-amber-400 active:translate-x-px active:translate-y-px transition-all"
                        >
                          Marcar como enviado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
