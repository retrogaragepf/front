"use client";

import { useRouter } from "next/navigation";
import { useChat } from "@/src/context/ChatContext";

const Sidebar = () => {
  const router = useRouter();
  const { openChat } = useChat();

  const handleOpenChat = () => {
    console.log("[Sidebar] open chat from dashboard");
    openChat({ asParticipant: "customer" });
  };

  return (
    <aside className="w-64 min-h-screen bg-amber-100 border-r-4 border-slate-900 flex flex-col">
      <div className="p-6 border-b-2 border-dashed">
        <h1 className="text-amber-900 font-display text-2xl">Mi Cuenta</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 font-sans">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full px-4 py-3 rounded-lg border-2 bg-amber-100 border-amber-900 font-bold text-left text-amber-900"
        >
          Panel Principal
        </button>

        <button
          onClick={() => router.push("/createProduct")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          + Publicar
        </button>

        <button
          onClick={() => router.push("/dashboard#mis-ventas")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          ¬ Mis Ventas
        </button>

        <button
          onClick={() => router.push("/dashboard/orders")}
          className="w-full px-4 py-3 rounded-lg border-2 bg-amber-100 border-amber-900 font-bold text-left text-amber-900"
        >
          ¬ Mis Ordenes
        </button>

        {/* <button
          onClick={() => router.push("/dashboard#estadisticas")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Estadísticas
        </button> */}

        {/* ✅ NUEVO LINK: Reseñas */}
        <button
          onClick={() => router.push("/dashboard/reviews")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Reseñas como vendedor
        </button>

        <button
          onClick={handleOpenChat}
          className="
            w-full px-4 py-3 rounded-lg border-2 text-left font-bold transition
            border-emerald-900 bg-amber-900 text-amber-50
            hover:bg-amber-50 hover:text-emerald-900
          "
        >
          Chat con usuarios
        </button>
      </nav>

      <div className="p-4 border-t-2 border-dashed space-y-3">
        {/* <button
          onClick={() => router.push("/dashboard#modo")}
          className="w-full px-4 py-2 rounded-lg hover:bg-amber-100 transition font-medium text-left"
        >
          Cambiar modo
        </button> */}

        {/* <button className="w-full px-4 py-2 rounded-lg hover:bg-amber-100 transition font-medium text-left text-red-600">
          Cerrar sesión
        </button> */}
      </div>
    </aside>
  );
};

export default Sidebar;
