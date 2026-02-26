"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useChat } from "@/src/context/ChatContext";
import { showToast } from "nextjs-toast-notify";

const Sidebar = (): ReactElement => {
  const router = useRouter();
  const { openChat, conversations } = useChat();
  const pendingChats = conversations.filter(
    (conversation) => conversation.unreadCount > 0,
  ).length;
  const hasPendingChats = pendingChats > 0;

  const handleOpenChat = () => {
    if (!hasPendingChats && conversations.length === 0) {
      showToast.info("No hay chats nuevos.", {
        duration: 1800,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      return;
    }
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
          className="w-full px-4 py-3  bg-amber-100 border-amber-900 font-bold text-left text-amber-900"
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
          onClick={() => router.push("/dashboard/sales")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          ¬ Mis Ventas 🚛
        </button>

        <button
          onClick={() => router.push("/dashboard/orders")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          ¬ Mis Compras 🛍️
        </button>

        {/* ✅ NUEVO LINK: Reseñas */}

        <button
          onClick={handleOpenChat}
          className={`w-full px-4 py-3 rounded-lg border-2 transition text-left ${
            hasPendingChats
              ? "border-emerald-700 bg-emerald-100 text-emerald-900"
              : "border-transparent hover:border-slate-900 hover:bg-amber-100"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            ¬ Chat usuarios 💬
            {hasPendingChats && (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-700" />
            )}
          </span>
        </button>
        <button
          onClick={() => router.push("/dashboard/reviews")}
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent hover:border-slate-900 hover:bg-amber-100 transition text-left"
        >
          ¬ Reseñas como vendedor
        </button>
      </nav>

      <div className="p-4 border-t-2 border-dashed space-y-3"></div>
    </aside>
  );
};

export default Sidebar;
