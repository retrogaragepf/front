"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import {
  adminChatService,
  type AdminChatConversation,
} from "@/src/services/adminChat.services";
import {
  getAllUsers,
  type AdminUIUser,
} from "@/src/services/users.services";
import AdminDirectChatModal from "@/src/components/admin/AdminDirectChatModal";

type ChatFilter = "all" | "active" | "banned";

type ChatRow = AdminChatConversation & {
  isBanned: boolean;
};

const ADMIN_READ_CHATS_STORAGE_KEY = "admin_read_chats";
const ADMIN_READ_CHATS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ADMIN_READ_CHATS_MAX_ENTRIES = 500;

type ReadMarkers = Record<string, number>;

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

function toTimestamp(value: string): number {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

type UsersIndex = {
  byId: Map<string, AdminUIUser>;
  byEmail: Map<string, AdminUIUser>;
};

function buildUsersIndex(users: AdminUIUser[]): UsersIndex {
  const byId = new Map<string, AdminUIUser>();
  const byEmail = new Map<string, AdminUIUser>();

  users.forEach((user) => {
    byId.set(String(user.id), user);
    if (user.email) byEmail.set(user.email.toLowerCase(), user);
  });

  return { byId, byEmail };
}

function loadReadMarkers(): ReadMarkers {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(ADMIN_READ_CHATS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.entries(parsed).reduce<ReadMarkers>((acc, [id, value]) => {
      const at = typeof value === "number" ? value : Number(value);
      if (
        id &&
        Number.isFinite(at) &&
        at > 0 &&
        now - at <= ADMIN_READ_CHATS_TTL_MS
      ) {
        acc[id] = at;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function persistReadMarkers(markers: ReadMarkers) {
  try {
    const entries = Object.entries(markers)
      .filter(([, at]) => Number.isFinite(at) && at > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, ADMIN_READ_CHATS_MAX_ENTRIES);
    localStorage.setItem(
      ADMIN_READ_CHATS_STORAGE_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Ignore storage errors.
  }
}

function loadHiddenConversationIds(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String).filter(Boolean));
  } catch {
    return new Set();
  }
}

function areChatRowsEqual(prev: ChatRow[], next: ChatRow[]): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (a.id !== b.id) return false;
    if (a.unreadCount !== b.unreadCount) return false;
    if (a.lastMessage !== b.lastMessage) return false;
    if (a.timestamp !== b.timestamp) return false;
    if (a.status !== b.status) return false;
    if (a.isBanned !== b.isBanned) return false;
    if (a.userName !== b.userName) return false;
    if (a.userEmail !== b.userEmail) return false;
  }

  return true;
}

function mergeChatsWithUsers(
  chats: AdminChatConversation[],
  usersIndex: UsersIndex,
  hiddenConversationIds: Set<string>,
): ChatRow[] {
  return chats
    .filter((chat) => {
      if (hiddenConversationIds.has(chat.id)) return false;
      const candidates = chat.deleteCandidates ?? [];
      return !candidates.some((id) => hiddenConversationIds.has(id));
    })
    .map((chat) => {
      const userById = usersIndex.byId.get(chat.userId);
      const userByEmail = chat.userEmail
        ? usersIndex.byEmail.get(chat.userEmail.toLowerCase())
        : undefined;
      const user = userById || userByEmail;
      const fallbackBlocked = chat.status === "blocked";

      return {
        ...chat,
        userName: user?.name || chat.userName || "Usuario",
        userEmail: user?.email || chat.userEmail || "Email no disponible",
        userId: user?.id ? String(user.id) : chat.userId,
        isBanned: Boolean(user?.isBanned ?? fallbackBlocked),
      };
    });
}

export default function AdminChatsSection(): ReactElement {
  const HIDDEN_CHATS_STORAGE_KEY = "admin_hidden_chats";
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [hiddenConversationIds, setHiddenConversationIds] = useState<Set<string>>(
    () => loadHiddenConversationIds(HIDDEN_CHATS_STORAGE_KEY),
  );
  const [readMarkers, setReadMarkers] = useState<ReadMarkers>(() => loadReadMarkers());
  const [directChatConversationId, setDirectChatConversationId] = useState<string | null>(null);
  const [directChatUserName, setDirectChatUserName] = useState("Usuario");

  const [filter, setFilter] = useState<ChatFilter>("all");
  const [loadingList, setLoadingList] = useState(false);
  const [busyConversationId, setBusyConversationId] = useState<string | null>(null);
  const [busyModerationConversationId, setBusyModerationConversationId] =
    useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hiddenConversationIdsRef = useRef(hiddenConversationIds);
  const readMarkersRef = useRef(readMarkers);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    try {
      if (!silent) setLoadingList(true);
      if (!silent) setError(null);
      console.log("[AdminChatsSection] loadData:start", { silent });

      const [rawChats, users] = await Promise.all([
        adminChatService.getConversations(),
        getAllUsers(),
      ]);

      const nextUsersIndex = buildUsersIndex(users);
      const merged = mergeChatsWithUsers(
        rawChats,
        nextUsersIndex,
        hiddenConversationIdsRef.current,
      );
      setChats((prev) => {
        const prevById = new Map(prev.map((chat) => [chat.id, chat]));
        const normalized = merged.map((chat) => {
          const prevChat = prevById.get(chat.id);
          const readAt = readMarkersRef.current[chat.id] ?? 0;
          const ts = toTimestamp(chat.timestamp);
          const prevTs = toTimestamp(prevChat?.timestamp || "");

          // Si el backend sí manda unreadCount, respetamos ese valor.
          if (chat.unreadCount > 0) return chat;

          // Si no hay unread en backend, inferimos "mensaje recibido" cuando hay actividad nueva.
          const newerThanRead = readAt > 0 && ts > readAt;
          const newerThanPrev = prevChat ? ts > prevTs : false;
          const messageChanged =
            prevChat &&
            (prevChat.lastMessage || "").trim() !==
              (chat.lastMessage || "").trim();
          if (newerThanRead || newerThanPrev || messageChanged) {
            return { ...chat, unreadCount: 1 };
          }

          // Si ya estaba marcado como leído localmente y no hay novedad, lo mantenemos en 0.
          if (readAt > 0 && ts <= readAt) {
            return { ...chat, unreadCount: 0 };
          }

          return chat;
        });
        return areChatRowsEqual(prev, normalized) ? prev : normalized;
      });
      console.log("[AdminChatsSection] loadData:ok", {
        chats: merged.length,
      });
    } catch (e: unknown) {
      console.error("[AdminChatsSection] loadData:error", e);
      const message =
        e instanceof Error
          ? e.message
          : "No se pudieron cargar las conversaciones.";
      setError(message);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    hiddenConversationIdsRef.current = hiddenConversationIds;
  }, [hiddenConversationIds]);

  useEffect(() => {
    readMarkersRef.current = readMarkers;
  }, [readMarkers]);

  useEffect(() => {
    // Persistimos ocultos para evitar que reaparezcan al refrescar.
    localStorage.setItem(
      HIDDEN_CHATS_STORAGE_KEY,
      JSON.stringify(Array.from(hiddenConversationIds)),
    );
  }, [hiddenConversationIds]);

  useEffect(() => {
    void loadData({ silent: false });
  }, [loadData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadData({ silent: true });
    }, 2_000);
    return () => window.clearInterval(intervalId);
  }, [loadData]);

  const handleDeleteConversation = async (
    conversationId: string,
    deleteCandidates: string[] = [],
  ) => {
    const confirmDelete = confirm("¿Seguro que querés borrar esta conversación?");
    if (!confirmDelete) return;

    setError(null);
    setBusyConversationId(conversationId);
    // Ocultamos de inmediato para evitar que reaparezca por auto-refresh.
    setHiddenConversationIds((prev) => {
      const next = new Set(prev);
      next.add(conversationId);
      deleteCandidates.forEach((id) => next.add(id));
      return next;
    });

    setChats((curr) => curr.filter((chat) => chat.id !== conversationId));

    try {
      // Debug: ayuda a validar qué ids exactos se envían al endpoint de borrado.
      console.log("[AdminChatsSection] delete ids:", [conversationId, ...deleteCandidates]);
      await adminChatService.deleteConversation(conversationId, deleteCandidates);
      await loadData({ silent: true });
    } catch (e: unknown) {
      console.error("Delete conversation error:", e);
      setError(
        e instanceof Error
          ? `${e.message} (se ocultó localmente para que no reaparezca).`
          : "No se pudo borrar la conversación en backend (se ocultó localmente).",
      );
    } finally {
      setBusyConversationId(null);
    }
  };

  const handleBanToggle = async (conversationId: string, isBanned: boolean) => {
    if (!conversationId) {
      setError("No se pudo resolver la conversación seleccionada.");
      return;
    }

    const confirmAction = confirm(
      `¿Seguro que querés ${isBanned ? "desbloquear" : "bloquear"} este usuario?`,
    );
    if (!confirmAction) return;

    setError(null);
    setBusyModerationConversationId(conversationId);

    const previous = chats;
    setChats((curr) =>
      curr.map((chat) =>
        chat.id === conversationId ? { ...chat, isBanned: !isBanned } : chat,
      ),
    );

    try {
      await adminChatService.blockConversation(conversationId, !isBanned);
      await loadData({ silent: true });
    } catch (e: unknown) {
      console.error("Chat user ban toggle error:", e);
      setChats(previous);
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar el estado de bloqueo.",
      );
    } finally {
      setBusyModerationConversationId(null);
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
    // El dashboard debe contar conversaciones pendientes, no cantidad de mensajes.
    () => chats.filter((chat) => chat.unreadCount > 0).length,
    [chats],
  );
  const hasUnread = totalUnread > 0;

  return (
    <div>
      <h2 className="font-display text-2xl text-amber-900 mb-2">
        Gestión de Chats
      </h2>

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
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 ${
              hasUnread
                ? "border-emerald-600 text-emerald-700 bg-emerald-100"
                : "border-zinc-500 text-zinc-800 bg-zinc-100"
            }`}
          >
            Mensajes sin responder: {totalUnread}
          </span>

          <button
            onClick={() => void loadData({ silent: false })}
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
              <th className="text-left font-extrabold text-amber-900">Asunto</th>
              <th className="text-left font-extrabold text-amber-900">Estado</th>
              <th className="text-left font-extrabold text-amber-900">Chat</th>
              <th className="text-left font-extrabold text-amber-900">Acción</th>
            </tr>
          </thead>

          <tbody>
            {filteredChats.map((chat) => {
              const busyDelete = busyConversationId === chat.id;
              const busyBanToggle = busyModerationConversationId === chat.id;

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

                  <td className="text-zinc-700 pt-4">{chat.subject || "Sin asunto"}</td>

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
                    <button
                      type="button"
                      onClick={() => {
                        const nextReadAt = Date.now();
                        setReadMarkers((prev) => {
                          const next = { ...prev, [chat.id]: nextReadAt };
                          persistReadMarkers(next);
                          return next;
                        });
                        // Al abrir desde admin, quitamos alerta local de no respondido.
                        setChats((curr) =>
                          curr.map((row) =>
                            row.id === chat.id ? { ...row, unreadCount: 0 } : row,
                          ),
                        );
                        setDirectChatConversationId(chat.id);
                        setDirectChatUserName(chat.userName || "Usuario");
                      }}
                      className="px-3 py-1 rounded-lg font-extrabold border-2 bg-amber-200 text-amber-900 border-amber-900"
                    >
                      Ir al chat
                    </button>
                  </td>

                  <td className="pt-4 pr-4">
                    <div className="flex gap-2">
                      <button
                        disabled={loadingList || busyBanToggle}
                        onClick={() => handleBanToggle(chat.id, chat.isBanned)}
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
                        onClick={() =>
                          handleDeleteConversation(chat.id, chat.deleteCandidates ?? [])
                        }
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
                <td colSpan={6} className="text-center p-6 text-zinc-500">
                  No hay conversaciones en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminDirectChatModal
        isOpen={Boolean(directChatConversationId)}
        conversationId={directChatConversationId}
        userName={directChatUserName}
        onClose={() => {
          setDirectChatConversationId(null);
          setDirectChatUserName("Usuario");
        }}
      />
    </div>
  );
}
