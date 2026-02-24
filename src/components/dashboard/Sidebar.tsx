"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useChat } from "@/src/context/ChatContext";

const Sidebar = (): ReactElement => {
  const router = useRouter();
  const { openChat, conversations } = useChat();

  const hasAnyMessage = conversations.some((conversation) =>
    Boolean((conversation.lastMessage || "").trim()),
  );

  const handleOpenChat = () => {
    openChat({ asParticipant: "customer" });
  };

  return (
    <aside className="w-64 min-h-screen bg-amber-100 border-r-4 border-slate-900 flex flex-col">
      <div className="p-6 border-b-2 border-dashed">
        <h2 className="text-amber-900 font-display text-2xl">Mi Cuenta</h2>
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
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          ¬ Mis Ordenes
        </button>

     

        {/* ✅ NUEVO LINK: Reseñas */}
        <button
          onClick={() => router.push("/dashboard/reviews")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          Reseñas como vendedor
        </button>

        <button
          onClick={handleOpenChat}
          disabled={!hasAnyMessage}
          className="
            w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Chat con usuarios
        </button>
      </nav>

      <div className="p-4 border-t-2 border-dashed space-y-3">
      
      </div>
    </aside>
  );
};

export default Sidebar;
