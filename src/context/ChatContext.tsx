"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChatConversation,
  ChatMessage,
  ChatMessageMap,
  ChatParticipant,
  OpenChatPayload,
} from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import { useAuth } from "@/src/context/AuthContext";
import { showToast } from "nextjs-toast-notify";

interface ChatContextValue {
  isChatOpen: boolean;
  currentParticipant: ChatParticipant;
  currentUserId: string | null;
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  unreadTotal: number;
  hasUnreadMessages: boolean;
  openChat: (payload?: OpenChatPayload) => void;
  closeChat: () => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (content: string) => void;
}

interface SocketLike {
  connected: boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
}

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, unknown>) => SocketLike;
  }
}

const ChatContext = createContext<ChatContextValue>({
  isChatOpen: false,
  currentParticipant: "customer",
  currentUserId: null,
  conversations: [],
  activeConversation: null,
  activeMessages: [],
  unreadTotal: 0,
  hasUnreadMessages: false,
  openChat: () => {},
  closeChat: () => {},
  selectConversation: () => {},
  sendMessage: () => {},
});

const formatTime = (date = new Date()): string =>
  date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function appendMessageSafe(messages: ChatMessage[], next: ChatMessage): ChatMessage[] {
  if (messages.some((message) => message.id === next.id)) return messages;
  return [...messages, next].sort((a, b) => a.createdAt - b.createdAt);
}

function dedupeConversations(list: ChatConversation[]): ChatConversation[] {
  const map = new Map<string, ChatConversation>();
  list.forEach((conversation) => {
    if (!conversation.id) return;
    const previous = map.get(conversation.id);
    map.set(conversation.id, previous ? { ...previous, ...conversation } : conversation);
  });
  return Array.from(map.values());
}

function mergeConversationData(
  remote: ChatConversation,
  previous?: ChatConversation,
): ChatConversation {
  if (!previous) return remote;

  const remoteName = remote.sellerName?.trim() || "";
  const prevName = previous.sellerName?.trim() || "";
  const remoteProduct = remote.product?.trim() || "";
  const prevProduct = previous.product?.trim() || "";

  const sellerName =
    remoteName && remoteName !== "Usuario" ? remoteName : prevName || remoteName;
  const product =
    remoteProduct ? remoteProduct : prevProduct || "";

  return {
    ...remote,
    sellerName: sellerName || "Usuario",
    seller: {
      name: sellerName || remote.seller?.name || previous.seller?.name || "Usuario",
    },
    product: product || "",
    unreadCount: Math.max(remote.unreadCount, previous.unreadCount),
  };
}

function replaceOptimisticMessage(
  list: ChatMessage[],
  optimisticId: string,
  persisted: ChatMessage,
): ChatMessage[] {
  const filtered = list.filter((message) => message.id !== optimisticId);
  return appendMessageSafe(filtered, persisted);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuth } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentParticipant, setCurrentParticipant] =
    useState<ChatParticipant>("customer");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<ChatMessageMap>({});
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const canUseChat = isAuth && chatService.isAuthenticated();
  const currentUserId = chatService.getCurrentUserId();

  const conversationsRef = useRef<ChatConversation[]>([]);
  const activeConversationRef = useRef<string>("");
  const socketRef = useRef<SocketLike | null>(null);
  const previousUnreadRef = useRef(0);
  const unreadReadyRef = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  const syncConversations = useCallback(async () => {
    if (!canUseChat) return;
    try {
      const remoteConversations = await chatService.getConversations();
      const normalizedConversations = dedupeConversations(remoteConversations);
      setConversations((prev) => {
        const prevById = new Map(prev.map((conversation) => [conversation.id, conversation]));
        return normalizedConversations.map((conversation) =>
          mergeConversationData(conversation, prevById.get(conversation.id)),
        );
      });
      setActiveConversationId((prev) => {
        if (prev && normalizedConversations.some((conversation) => conversation.id === prev)) {
          return prev;
        }
        return normalizedConversations[0]?.id ?? "";
      });
    } catch (error) {
      if ((error as Error).message === "NO_AUTH") return;
      console.error("No se pudieron sincronizar conversaciones:", error);
    }
  }, [canUseChat]);

  const syncMessages = useCallback(async (conversationId: string) => {
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
        remoteMessages.find((message) => message.senderId && message.senderId !== currentUserId) ??
        latestMessage;

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
  }, [canUseChat]);

  const clearUnreadLocal = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }, []);

  const joinConversationRoom = useCallback((conversationId: string) => {
    if (!conversationId || !socketRef.current?.connected) return;
    socketRef.current.emit("joinConversation", conversationId);
  }, []);

  useEffect(() => {
    if (!canUseChat) return;
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

  useEffect(() => {
    if (!canUseChat) return;
    let canceled = false;
    const scriptId = "socket-io-client-cdn";

    const mountSocket = () => {
      if (canceled || !window.io || socketRef.current) return;
      const token = chatService.getSocketToken();
      if (!token) return;

      const socket = window.io(chatService.getSocketUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        const activeId = activeConversationRef.current;
        if (activeId) socket.emit("joinConversation", activeId);
      });

      socket.on("connect_error", (error: unknown) => {
        console.error("Error conectando socket chat:", error);
      });

      socket.on("newMessage", (...args: unknown[]) => {
        const payload = args[0];
        if (!isObjectRecord(payload)) return;
        const fallbackConversationId = activeConversationRef.current;
        const incoming = chatService.normalizeSocketMessage(
          payload,
          fallbackConversationId,
        );
        if (!incoming) return;
        const liveUserId = chatService.getCurrentUserId();
        if (liveUserId && incoming.senderId === liveUserId) return;

        setMessagesByConversation((prev) => ({
          ...prev,
          [incoming.conversationId]: appendMessageSafe(
            prev[incoming.conversationId] ?? [],
            incoming,
          ),
        }));

        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation.id !== incoming.conversationId) return conversation;
            const isOpenConversation =
              isChatOpen && activeConversationRef.current === incoming.conversationId;
            return {
              ...conversation,
              lastMessage: incoming.content,
              timestamp: `Hoy, ${incoming.time}`,
              unreadCount: isOpenConversation ? 0 : conversation.unreadCount + 1,
            };
          }),
        );
      });

      socketRef.current = socket;
    };

    if (window.io) {
      mountSocket();
    } else if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
      script.async = true;
      script.onload = mountSocket;
      script.onerror = () => {
        console.warn(
          "[ChatContext] socket.io bloqueado por navegador/extensión. Chat seguirá por REST.",
        );
      };
      document.body.appendChild(script);
    } else {
      const existingScript = document.getElementById(scriptId);
      existingScript?.addEventListener("load", mountSocket);
    }

    return () => {
      canceled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [canUseChat, isChatOpen]);

  const ensureConversation = useCallback(async (payload: OpenChatPayload): Promise<string> => {
    if (!canUseChat) return "";
    if (payload.conversationId) return payload.conversationId;

    const sellerId = payload.sellerId?.trim();
    const customerId = payload.customerId?.trim() || chatService.getCurrentUserId();

    if (!sellerId || !customerId) {
      return conversationsRef.current[0]?.id ?? "";
    }

    const existing = conversationsRef.current.find((conversation) => {
      const ids = conversation.participantIds ?? [];
      return ids.includes(sellerId) && ids.includes(customerId);
    });
    if (existing) return existing.id;

    const createdConversation = await chatService.createConversation({
      type: "PRIVATE",
      participantIds: [customerId, sellerId],
    });

    const hydratedConversation: ChatConversation = {
      ...createdConversation,
      sellerName: payload.sellerName || createdConversation.sellerName,
      seller: { name: payload.sellerName || createdConversation.seller.name },
      product: payload.product || createdConversation.product,
      customer: payload.customerName || createdConversation.customer,
      customerId,
      sellerId,
      participantIds: [customerId, sellerId],
    };

    setConversations((prev) => {
      const merged = dedupeConversations([hydratedConversation, ...prev]);
      return merged.map((conversation) =>
        conversation.id === hydratedConversation.id
          ? mergeConversationData(hydratedConversation, conversation)
          : conversation,
      );
    });
    setMessagesByConversation((prev) => ({
      ...prev,
      [hydratedConversation.id]: prev[hydratedConversation.id] ?? [],
    }));
    return hydratedConversation.id;
  }, [canUseChat]);

  const openChat = useCallback(
    (payload?: OpenChatPayload) => {
      setIsChatOpen(true);
      const nextParticipant = payload?.asParticipant;
      if (nextParticipant) setCurrentParticipant(nextParticipant);

      if (!canUseChat) {
        showToast.warning("Debes iniciar sesión para usar el chat.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      if (!payload) return;
      void (async () => {
        try {
          const conversationId = await ensureConversation(payload);
          if (!conversationId) {
            showToast.warning("No se pudo abrir la conversación.", {
              duration: 2200,
              progress: true,
              position: "top-center",
              transition: "popUp",
              icon: "",
              sound: true,
            });
            return;
          }
          setActiveConversationId(conversationId);
        } catch (error) {
          console.error("No se pudo abrir conversación:", error);
          showToast.error("No se pudo abrir el chat. Intenta de nuevo.", {
            duration: 2200,
            progress: true,
            position: "top-center",
            transition: "popUp",
            icon: "",
            sound: true,
          });
        }
      })();
    },
    [canUseChat, ensureConversation],
  );

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      clearUnreadLocal(conversationId);
      joinConversationRoom(conversationId);
    },
    [clearUnreadLocal, joinConversationRoom],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent) {
        return;
      }

      if (!canUseChat) {
        showToast.warning("Debes iniciar sesión para enviar mensajes.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      if (!activeConversationId) {
        showToast.info("Selecciona o crea una conversación antes de enviar.", {
          duration: 2200,
          progress: true,
          position: "top-center",
          transition: "popUp",
          icon: "",
          sound: true,
        });
        return;
      }

      const currentUserId = chatService.getCurrentUserId();
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: currentUserId ?? undefined,
        from: "customer",
        content: normalizedContent,
        time: formatTime(),
        createdAt: Date.now(),
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: appendMessageSafe(
          prev[activeConversationId] ?? [],
          optimisticMessage,
        ),
      }));

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                lastMessage: normalizedContent,
                timestamp: `Hoy, ${optimisticMessage.time}`,
              }
            : conversation,
        ),
      );

      try {
        const persistedMessage = await chatService.sendMessage({
          conversationId: activeConversationId,
          content: normalizedContent,
        });

        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: replaceOptimisticMessage(
            prev[activeConversationId] ?? [],
            optimisticMessage.id,
            persistedMessage,
          ),
        }));
      } catch (error) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] ?? []).filter(
            (message) => message.id !== optimisticMessage.id,
          ),
        }));
        console.error("No se pudo enviar mensaje al backend:", error);
      }
    },
    [activeConversationId, canUseChat],
  );

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(
    () => (activeConversation ? messagesByConversation[activeConversation.id] ?? [] : []),
    [activeConversation, messagesByConversation],
  );

  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
    [conversations],
  );

  useEffect(() => {
    if (!isChatOpen || !activeConversationId) return;
    clearUnreadLocal(activeConversationId);
  }, [activeConversationId, clearUnreadLocal, isChatOpen]);

  useEffect(() => {
    if (!unreadReadyRef.current) {
      unreadReadyRef.current = true;
      previousUnreadRef.current = unreadTotal;
      return;
    }

    if (canUseChat && unreadTotal > previousUnreadRef.current) {
      console.log("[ChatContext] mensaje nuevo recibido", {
        previousUnread: previousUnreadRef.current,
        unreadTotal,
      });
      showToast.info("Mensaje nuevo recibido", {
        duration: 2200,
        progress: true,
        position: "top-right",
        transition: "popUp",
        icon: "",
        sound: true,
      });
    }

    previousUnreadRef.current = unreadTotal;
  }, [canUseChat, unreadTotal]);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        currentParticipant,
        currentUserId,
        conversations,
        activeConversation,
        activeMessages,
        unreadTotal,
        hasUnreadMessages: unreadTotal > 0,
        openChat,
        closeChat,
        selectConversation,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
