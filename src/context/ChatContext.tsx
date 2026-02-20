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
  on: (event: string, cb: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
}

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, any>) => SocketLike;
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
      setConversations(remoteConversations);
      setActiveConversationId((prev) => {
        if (prev && remoteConversations.some((conversation) => conversation.id === prev)) {
          return prev;
        }
        return remoteConversations[0]?.id ?? "";
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
    } catch (error) {
      if ((error as Error).message === "NO_AUTH") return;
      console.error("No se pudieron sincronizar mensajes:", error);
    }
  }, [canUseChat]);

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

      socket.on("newMessage", (payload: Record<string, any>) => {
        const fallbackConversationId = activeConversationRef.current;
        const incoming = chatService.normalizeSocketMessage(
          payload,
          fallbackConversationId,
        );
        if (!incoming) return;

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
              unreadCount: isOpenConversation
                ? conversation.unreadCount
                : conversation.unreadCount + 1,
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

    setConversations((prev) => [hydratedConversation, ...prev]);
    setMessagesByConversation((prev) => ({
      ...prev,
      [hydratedConversation.id]: prev[hydratedConversation.id] ?? [],
    }));
    return hydratedConversation.id;
  }, [canUseChat]);

  const openChat = useCallback(
    (payload?: OpenChatPayload) => {
      if (!canUseChat) return;
      const nextParticipant = payload?.asParticipant;
      if (nextParticipant) setCurrentParticipant(nextParticipant);
      setIsChatOpen(true);

      if (!payload) return;
      void (async () => {
        try {
          const conversationId = await ensureConversation(payload);
          if (conversationId) setActiveConversationId(conversationId);
        } catch (error) {
          console.error("No se pudo abrir conversación:", error);
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
      joinConversationRoom(conversationId);
    },
    [joinConversationRoom],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (!normalizedContent || !activeConversationId || !canUseChat) {
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
          [activeConversationId]: (prev[activeConversationId] ?? []).map((message) =>
            message.id === optimisticMessage.id ? persistedMessage : message,
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
