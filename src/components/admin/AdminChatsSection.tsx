"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminChatService,
  type AdminChatConversation,
} from "@/src/services/adminChat.services";
import {
  blockUser,
  getAllUsers,
  unblockUser,
  type AdminUIUser,
} from "@/src/services/users.services";

type ChatFilter = "all" | "active" | "banned";

type ChatRow = AdminChatConversation & {
  isBanned: boolean;
};

function formatTimestamp(value: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildUsersMap(users: AdminUIUser[]): Map<string, AdminUIUser> {
  return new Map(users.map((user) => [String(user.id), user]));
}

function mergeChatsWithUsers(
  chats: AdminChatConversation[],
  usersMap: Map<string, AdminUIUser>,
): ChatRow[] {
  return chats.map((chat) => {
    const user = usersMap.get(chat.userId);
    const fallbackBlocked = chat.status === "blocked";

    return {
      ...chat,
      userName: user?.name || chat.userName || "Usuario",
      userEmail: user?.email || chat.userEmail || "Email no disponible",
      isBanned: Boolean(user?.isBanned ?? fallbackBlocked),
    };
  });
}

export default function AdminChatsSection() {
  const [chats, setChats] = useState<ChatRow[]>([]);

  const [filter, setFilter] = useState<ChatFilter>("all");
  const [loadingList, setLoadingList] = useState(false);
  const [busyConversationId, setBusyConversationId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);

      const [rawChats, users] = await Promise.all([
        adminChatService.getConversations(),
        getAllUsers(),
      ]);

      const nextUsersMap = buildUsersMap(users);
      setChats(mergeChatsWithUsers(rawChats, nextUsersMap));
    } catch (e: unknown) {
      console.error("Admin chats load error:", e);
      const message =
        e instanceof Error
          ? e.message
          : "No se pudieron cargar las conversaciones.";
      setError(message);
      setChats([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDeleteConversation = async (conversationId: string) => {
    const confirmDelete = confirm("¿Seguro que querés borrar esta conversación?");
    if (!confirmDelete) return;

    setError(null);
    setBusyConversationId(conversationId);

    const previous = chats;
    setChats((curr) => curr.filter((chat) => chat.id !== conversationId));

    try {
      await adminChatService.deleteConversation(conversationId);
      await loadData();
    } catch (e: unknown) {
      console.error("Delete conversation error:", e);
      setChats(previous);
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo borrar la conversación seleccionada.",
      );
    } finally {
      setBusyConversationId(null);
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    if (!userId) {
      setError("No se pudo resolver el usuario de esta conversación.");
      return;
    }

    const confirmAction = confirm(
      `¿Seguro que querés ${isBanned ? "desbloquear" : "bloquear"} este usuario?`,
    );
    if (!confirmAction) return;

    setError(null);
    setBusyUserId(userId);

    const previous = chats;
    setChats((curr) =>
      curr.map((chat) =>
        chat.userId === userId ? { ...chat, isBanned: !isBanned } : chat,
      ),
    );

    try {
      if (isBanned) await unblockUser(userId);
      else await blockUser(userId);
      await loadData();
    } catch (e: unknown) {
      console.error("Chat user ban toggle error:", e);
      setChats(previous);
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar el estado de bloqueo.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (filter === "banned") return chat.isBanned;
      if (filter === "active") return !chat.isBanned;
      return true;
    });
  }, [chats, filter]);

  const filterLabel: Record<ChatFilter, string> = {
    all: "Todos",
    active: "Activos",
    banned: "Bloqueados",
  };

  const totalUnread = useMemo(
    () => chats.reduce((acc, chat) => acc + chat.unreadCount, 0),
    [chats],
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-amber-900 mb-2">
        Gestión de Chats
      </h1>

      <p className="text-zinc-700 mb-6">
        Conversaciones controladas por administración. Usuarios, estado y
        moderación del chat.
      </p>

      <div className="flex gap-3 mb-6">
        {(["all", "active", "banned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] ${
              filter === f
                ? "bg-amber-200 text-amber-900"
                : "bg-white text-amber-900"
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold border-2 border-emerald-600 text-emerald-700 bg-emerald-100">
            Mensajes sin responder: {totalUnread}
          </span>

          <button
            onClick={loadData}
            disabled={loadingList}
            className="px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold bg-white text-amber-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] disabled:opacity-60"
          >
            Recargar
          </button>
        </div>
      </div>

      {loadingList && (
        <div className="mb-4 text-zinc-600 font-bold">Cargando conversaciones...</div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl border-2 border-red-700 bg-red-100 text-red-800 font-bold">
          {error}
        </div>
      )}

      <div className="bg-amber-100 border-2 border-amber-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <table className="w-full">
          <thead className="bg-amber-100 border-b-2 border-amber-900">
            <tr>
              <th className="p-4 text-left font-extrabold text-amber-900">Nombre</th>
              <th className="text-left font-extrabold text-amber-900">Correo</th>
              <th className="text-left font-extrabold text-amber-900">Estado</th>
              <th className="text-left font-extrabold text-amber-900">Acción</th>
            </tr>
          </thead>

          <tbody>
            {filteredChats.map((chat) => {
              const busyDelete = busyConversationId === chat.id;
              const busyBanToggle = busyUserId === chat.userId;

              return (
                <tr key={chat.id} className="border-t border-amber-200 align-top">
                  <td className="p-4 font-bold text-zinc-800">
                    <div>{chat.userName || "Usuario"}</div>
                    <div className="text-xs text-zinc-500 font-semibold mt-1">
                      Último mensaje: {chat.lastMessage || "Sin mensajes"}
                    </div>
                    <div className="text-xs text-zinc-500 font-semibold mt-1">
                      Fecha: {formatTimestamp(chat.timestamp)}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="inline-block mt-2 px-2 py-1 text-[11px] font-extrabold rounded-lg border-2 border-emerald-600 text-emerald-700 bg-white">
                        Mensaje recibido
                      </div>
                    )}
                  </td>

                  <td className="text-zinc-700 pt-4">{chat.userEmail || "-"}</td>

                  <td className="pt-4">
                    {chat.isBanned ? (
                      <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-extrabold">
                        BLOQUEADO
                      </span>
                    ) : (
                      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-extrabold">
                        ACTIVO
                      </span>
                    )}
                  </td>

                  <td className="pt-4 pr-4">
                    <div className="flex gap-2">
                      <button
                        disabled={loadingList || busyBanToggle}
                        onClick={() => handleBanToggle(chat.userId, chat.isBanned)}
                        className={`px-3 py-1 rounded-lg font-extrabold border-2 disabled:opacity-60 ${
                          chat.isBanned
                            ? "bg-emerald-700 text-white border-emerald-800"
                            : "bg-red-600 text-white border-red-700"
                        }`}
                      >
                        {busyBanToggle
                          ? "..."
                          : chat.isBanned
                            ? "Unblock"
                            : "Block"}
                      </button>

                      <button
                        disabled={loadingList || busyDelete}
                        onClick={() => handleDeleteConversation(chat.id)}
                        className="px-3 py-1 rounded-lg font-extrabold border-2 disabled:opacity-60 bg-white text-amber-900 border-amber-900"
                      >
                        {busyDelete ? "..." : "Borrar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loadingList && filteredChats.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-6 text-zinc-500">
                  No hay conversaciones en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
