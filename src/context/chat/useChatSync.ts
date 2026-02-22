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

type ReadMarkers = Record<string, number>;

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
}: Params) {
  const localReadMarkersRef = useRef<ReadMarkers>({});

  const applyLocalReadState = useCallback((conversation: ChatConversation) => {
    const readAt = localReadMarkersRef.current[conversation.id];
    if (!readAt) return conversation;

    if (conversation.unreadCount <= 0) {
      delete localReadMarkersRef.current[conversation.id];
      persistReadMarkers(localReadMarkersRef.current);
      return conversation;
    }

    const remoteTimestamp = toTimestamp(conversation.timestamp);
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
      const remoteConversations = await chatService.getConversations();
      const hiddenConversationIds = loadHiddenConversationIds();
      const normalizedConversations = dedupeConversations(remoteConversations)
        .filter((conversation) => !hiddenConversationIds.has(conversation.id))
        .map(applyLocalReadState);

      setConversations((prev) => {
        const prevById = new Map(prev.map((conversation) => [conversation.id, conversation]));
        return normalizedConversations.map((conversation) =>
          mergeConversationData(conversation, prevById.get(conversation.id)),
        );
      });

      setActiveConversationId((prev) => {
        if (
          prev &&
          normalizedConversations.some((conversation) => conversation.id === prev)
        ) {
          return prev;
        }
        return normalizedConversations[0]?.id ?? "";
      });
    } catch (error) {
      if ((error as Error).message === "NO_AUTH") return;
      console.error("No se pudieron sincronizar conversaciones:", error);
    }
  }, [
    applyLocalReadState,
    canUseChat,
    setActiveConversationId,
    setConversations,
  ]);

  const syncMessages = useCallback(
    async (conversationId: string) => {
      if (!canUseChat || !conversationId) return;
      try {
        const remoteMessages = await chatService.getMessages(conversationId);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: remoteMessages,
        }));

        const latestMessage =
          remoteMessages.length > 0 ? remoteMessages[remoteMessages.length - 1] : null;
        const otherMessage =
          remoteMessages.find(
            (message) => message.senderId && message.senderId !== currentUserId,
          ) ?? latestMessage;

        if (latestMessage || otherMessage?.senderName) {
          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.id !== conversationId) return conversation;
              return {
                ...conversation,
                sellerName:
                  conversation.sellerName && conversation.sellerName !== "Usuario"
                    ? conversation.sellerName
                    : otherMessage?.senderName || conversation.sellerName || "Usuario",
                seller: {
                  name:
                    conversation.seller?.name && conversation.seller.name !== "Usuario"
                      ? conversation.seller.name
                      : otherMessage?.senderName || conversation.seller?.name || "Usuario",
                },
                timestamp: latestMessage
                  ? new Date(latestMessage.createdAt).toISOString()
                  : conversation.timestamp,
              };
            }),
          );
        }
      } catch (error) {
        if ((error as Error).message === "NO_AUTH") return;
        console.error("No se pudieron sincronizar mensajes:", error);
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
    },
    [socketRef],
  );

  useEffect(() => {
    if (!canUseChat) return;
    localReadMarkersRef.current = loadReadMarkers();
    void syncConversations();
  }, [canUseChat, syncConversations]);

  useEffect(() => {
    if (!canUseChat) return;
    const intervalId = window.setInterval(() => {
      void syncConversations();
    }, 12000);
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
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeConversationId, isChatOpen, syncMessages]);

  return { clearUnreadLocal, joinConversationRoom };
}
