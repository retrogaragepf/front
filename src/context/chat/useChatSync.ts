import {
  Dispatch,
  SetStateAction,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ChatConversation, ChatMessageMap } from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import { dedupeConversations, mergeConversationData } from "@/src/context/chat/chatStateUtils";
import { SocketLike } from "@/src/context/chat/useChatSocket";

type Params = {
  canUseChat: boolean;
  isChatOpen: boolean;
  currentUserId: string | null;
  activeConversationId: string;
  socketRef: MutableRefObject<SocketLike | null>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
  setMessagesByConversation: Dispatch<SetStateAction<ChatMessageMap>>;
  setActiveConversationId: Dispatch<SetStateAction<string>>;
};

const CHAT_READ_MARKERS_KEY = "chat_read_markers";
const CHAT_HIDDEN_CONVERSATIONS_KEY = "chat_hidden_conversations";
const CHAT_READ_MARKERS_TTL_MS = 1000 * 60 * 60 * 24;
const CHAT_READ_MARKERS_MAX_ENTRIES = 200;
const CHAT_FALLBACK_SYNC_INTERVAL_MS = 2_000;
const CHAT_MESSAGES_FALLBACK_SYNC_INTERVAL_MS = 2_000;

type ReadMarkers = Record<string, number>;

function areConversationsEqual(
  prev: ChatConversation[],
  next: ChatConversation[],
): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (a.id !== b.id) return false;
    if (a.unreadCount !== b.unreadCount) return false;
    if (a.lastMessage !== b.lastMessage) return false;
    if (a.timestamp !== b.timestamp) return false;
    if (a.sellerName !== b.sellerName) return false;
    if (a.product !== b.product) return false;
  }

  return true;
}

function areMessagesEqualById(
  prev: { id: string }[],
  next: { id: string }[],
): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    if (prev[i].id !== next[i].id) return false;
  }
  return true;
}

function toTimestamp(value: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function loadReadMarkers(): ReadMarkers {
  if (typeof window === "undefined") return {};
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(CHAT_READ_MARKERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.entries(parsed).reduce<ReadMarkers>((acc, [id, value]) => {
      const at = typeof value === "number" ? value : Number(value);
      if (
        id &&
        Number.isFinite(at) &&
        at > 0 &&
        now - at <= CHAT_READ_MARKERS_TTL_MS
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
  if (typeof window === "undefined") return;
  try {
    const entries = Object.entries(markers)
      .filter(([, at]) => Number.isFinite(at) && at > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, CHAT_READ_MARKERS_MAX_ENTRIES);
    sessionStorage.setItem(
      CHAT_READ_MARKERS_KEY,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

function loadHiddenConversationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CHAT_HIDDEN_CONVERSATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function useChatSync({
  canUseChat,
  isChatOpen,
  currentUserId,
  activeConversationId,
  socketRef,
  setConversations,
  setMessagesByConversation,
  setActiveConversationId,
}: Params): {
  clearUnreadLocal: (conversationId: string) => void;
  joinConversationRoom: (conversationId: string) => void;
} {
  const localReadMarkersRef = useRef<ReadMarkers>({});
  const hasSyncedConversationsRef = useRef(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  // Rastreo de 404 consecutivos por conversación para no borrar conversaciones recién creadas.
  const sync404CountRef = useRef<Record<string, number>>({});

  const applyLocalReadState = useCallback((conversation: ChatConversation) => {
    const readAt = localReadMarkersRef.current[conversation.id];
    if (!readAt) return conversation;

    if (conversation.unreadCount <= 0) {
      delete localReadMarkersRef.current[conversation.id];
      persistReadMarkers(localReadMarkersRef.current);
      return conversation;
    }

    const remoteTimestamp = toTimestamp(conversation.timestamp);
    if (remoteTimestamp <= 0) {
      // Si backend no manda timestamp válido, no forzamos lectura local.
      return conversation;
    }
    if (remoteTimestamp > readAt) {
      delete localReadMarkersRef.current[conversation.id];
      persistReadMarkers(localReadMarkersRef.current);
      return conversation;
    }

    return { ...conversation, unreadCount: 0 };
  }, []);

  const syncConversations = useCallback(async () => {
    if (!canUseChat) return;
    try {
      console.log("[useChatSync] syncConversations:start", {
        activeConversationId,
        isChatOpen,
      });
      const remoteConversations = await chatService.getConversations();
      const hiddenConversationIds = loadHiddenConversationIds();
      const baseConversations = dedupeConversations(remoteConversations)
        .filter((conversation) => !hiddenConversationIds.has(conversation.id))
        .map(applyLocalReadState)
        .sort((a, b) => {
          const byTimestamp = toTimestamp(b.timestamp) - toTimestamp(a.timestamp);
          if (byTimestamp !== 0) return byTimestamp;
          return a.id.localeCompare(b.id);
        });

      setConversations((prev) => {
        const isInitialSync = !hasSyncedConversationsRef.current;
        const prevById = new Map(prev.map((conversation) => [conversation.id, conversation]));
        const next = baseConversations.map((conversation) => {
          const prevConversation = prevById.get(conversation.id);
          const merged = mergeConversationData(conversation, prevConversation);

          const isActiveOpen =
            isChatOpen && activeConversationId === merged.id;
          if (isActiveOpen) {
            return merged.unreadCount === 0 ? merged : { ...merged, unreadCount: 0 };
          }

          // Fallback: algunos backends no devuelven unreadCount correcto.
          if (merged.unreadCount <= 0) {
            const remoteTs = toTimestamp(merged.timestamp);
            const prevTs = toTimestamp(prevConversation?.timestamp || "");
            const readAt = localReadMarkersRef.current[merged.id] ?? 0;
            const prevUnread = prevConversation?.unreadCount ?? 0;
            const newerThanRead = readAt > 0 && remoteTs > readAt;
            const newerThanPrev = prevConversation ? remoteTs > prevTs : false;
            const messageChanged =
              prevConversation &&
              (prevConversation.lastMessage || "").trim() !==
                (merged.lastMessage || "").trim();

            if (newerThanRead || newerThanPrev || messageChanged) {
              console.log("[useChatSync] unread inferred", {
                conversationId: merged.id,
                newerThanRead,
                newerThanPrev,
                messageChanged,
                prevUnread: prevConversation?.unreadCount ?? 0,
              });
              return { ...merged, unreadCount: 1 };
            }

            const hasActivity = Boolean(
              (merged.lastMessage || "").trim() || (merged.timestamp || "").trim(),
            );
            // Si aparece una conversación nueva después del primer sync (polling sin socket),
            // la marcamos con no leído para activar alerta en navbar.
            if (!isInitialSync && !prevConversation && hasActivity) {
              console.log("[useChatSync] unread inferred:new conversation", {
                conversationId: merged.id,
              });
              return { ...merged, unreadCount: 1 };
            }

            // Si ya teníamos no leído local y backend devuelve 0, lo conservamos
            // hasta que exista evidencia de lectura local.
            if (prevUnread > 0) {
              if (readAt <= 0) {
                return { ...merged, unreadCount: prevUnread };
              }
              if (remoteTs <= 0 || remoteTs > readAt) {
                return { ...merged, unreadCount: prevUnread };
              }
            }
          }

          return merged;
        });
        return areConversationsEqual(prev, next) ? prev : next;
      });
      hasSyncedConversationsRef.current = true;
      console.log("[useChatSync] syncConversations:ok", {
        remote: remoteConversations.length,
      });

      const socket = socketRef.current;
      if (socket?.connected) {
        const remoteIds = new Set(baseConversations.map((conversation) => conversation.id));
        // Limpiamos rooms que ya no existen localmente.
        joinedRoomsRef.current.forEach((id) => {
          if (!remoteIds.has(id)) joinedRoomsRef.current.delete(id);
        });
        // Nos unimos a todas las conversaciones para recibir eventos en tiempo real.
        baseConversations.forEach((conversation) => {
          if (joinedRoomsRef.current.has(conversation.id)) return;
          socket.emit("joinConversation", conversation.id);
          joinedRoomsRef.current.add(conversation.id);
        });
      }

      setActiveConversationId((prev) => {
        if (
          prev &&
          baseConversations.some((conversation) => conversation.id === prev)
        ) {
          return prev;
        }
        return baseConversations[0]?.id ?? "";
      });
    } catch (error) {
      if ((error as Error).message === "NO_AUTH") return;
      console.error("[useChatSync] syncConversations:error", error);
    }
  }, [
    applyLocalReadState,
    activeConversationId,
    canUseChat,
    isChatOpen,
    socketRef,
    setActiveConversationId,
    setConversations,
  ]);

  const syncMessages = useCallback(
    async (conversationId: string) => {
      if (!canUseChat || !conversationId) return;
      try {
        console.log("[useChatSync] syncMessages:start", { conversationId });
        const remoteMessages = await chatService.getMessages(conversationId);
        // Éxito: resetear contador de 404 si existía.
        delete sync404CountRef.current[conversationId];
        setMessagesByConversation((prev) => {
          const previousMessages = prev[conversationId] ?? [];
          if (areMessagesEqualById(previousMessages, remoteMessages)) return prev;
          return {
            ...prev,
            [conversationId]: remoteMessages,
          };
        });

        const latestMessage =
          remoteMessages.length > 0 ? remoteMessages[remoteMessages.length - 1] : null;
        const otherMessage =
          remoteMessages.find(
            (message) => message.senderId && message.senderId !== currentUserId,
          ) ?? latestMessage;

        if (latestMessage || otherMessage?.senderName) {
          setConversations((prev) => {
            let changed = false;

            const next = prev.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;

              const normalizedCurrentName = (conversation.sellerName || "").trim().toLowerCase();
              const normalizedCustomerName = (conversation.customer || "").trim().toLowerCase();
              const looksLikeOwnName =
                Boolean(normalizedCurrentName) &&
                (normalizedCurrentName === normalizedCustomerName ||
                  normalizedCurrentName === "tú" ||
                  normalizedCurrentName === "tu");
              const shouldPreferOtherSenderName =
                Boolean(otherMessage?.senderName) &&
                (conversation.sellerId === currentUserId ||
                  conversation.sellerName === "Usuario" ||
                  looksLikeOwnName);

              const nextSellerName =
                shouldPreferOtherSenderName
                  ? (otherMessage?.senderName as string)
                  : conversation.sellerName && conversation.sellerName !== "Usuario"
                    ? conversation.sellerName
                    : otherMessage?.senderName || conversation.sellerName || "Usuario";

              const nextSellerNestedName =
                shouldPreferOtherSenderName
                  ? (otherMessage?.senderName as string)
                  : conversation.seller?.name && conversation.seller.name !== "Usuario"
                    ? conversation.seller.name
                  : otherMessage?.senderName || conversation.sellerName || "Usuario";

              const nextTimestamp = latestMessage
                ? new Date(latestMessage.createdAt).toISOString()
                : conversation.timestamp;

              const same =
                conversation.sellerName === nextSellerName &&
                (conversation.seller?.name || "") === nextSellerNestedName &&
                conversation.timestamp === nextTimestamp;

              if (same) return conversation;
              changed = true;

              return {
                ...conversation,
                sellerName: nextSellerName,
                seller: { name: nextSellerNestedName },
                timestamp: nextTimestamp,
              };
            });

            return changed ? next : prev;
          });
        }
      } catch (error) {
        if ((error as Error).message === "NO_AUTH") return;
        const status = (error as Error & { status?: number }).status;
        if (status === 404) {
          const count = (sync404CountRef.current[conversationId] ?? 0) + 1;
          sync404CountRef.current[conversationId] = count;
          // Solo eliminar después de 3 fallos consecutivos (grace period para
          // conversaciones recién creadas que el backend aún no registró).
          if (count >= 3) {
            console.warn("[useChatSync] syncMessages:404:removing", { conversationId, count });
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
            setMessagesByConversation((prev) => {
              if (!(conversationId in prev)) return prev;
              const next = { ...prev };
              delete next[conversationId];
              return next;
            });
            delete sync404CountRef.current[conversationId];
          }
          return;
        }
        console.error("[useChatSync] syncMessages:error", { conversationId, error });
      }
    },
    [canUseChat, currentUserId, setConversations, setMessagesByConversation],
  );

  const clearUnreadLocal = useCallback(
    (conversationId: string) => {
      const now = Date.now();
      localReadMarkersRef.current[conversationId] = now;
      persistReadMarkers(localReadMarkersRef.current);

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    },
    [setConversations],
  );

  const joinConversationRoom = useCallback(
    (conversationId: string) => {
      if (!conversationId || !socketRef.current?.connected) return;
      socketRef.current.emit("joinConversation", conversationId);
      joinedRoomsRef.current.add(conversationId);
    },
    [socketRef],
  );

  useEffect(() => {
    if (canUseChat) return;
    joinedRoomsRef.current.clear();
  }, [canUseChat]);

  useEffect(() => {
    if (!canUseChat) return;
    localReadMarkersRef.current = loadReadMarkers();
    void syncConversations();
  }, [canUseChat, syncConversations]);

  useEffect(() => {
    if (!canUseChat) return;
    const intervalId = window.setInterval(() => {
      // Polling siempre activo para evitar quedarse sin actualizaciones
      // cuando el backend no emite eventos en todos los casos.
      void syncConversations();
    }, CHAT_FALLBACK_SYNC_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [canUseChat, syncConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    void syncMessages(activeConversationId);
    joinConversationRoom(activeConversationId);
  }, [activeConversationId, joinConversationRoom, syncMessages]);

  useEffect(() => {
    if (!isChatOpen || !activeConversationId) return;
    const intervalId = window.setInterval(() => {
      void syncMessages(activeConversationId);
    }, CHAT_MESSAGES_FALLBACK_SYNC_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [activeConversationId, isChatOpen, syncMessages]);

  return { clearUnreadLocal, joinConversationRoom };
}
