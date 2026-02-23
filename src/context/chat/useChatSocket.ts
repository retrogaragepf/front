import { useEffect, MutableRefObject, Dispatch, SetStateAction } from "react";
import { ChatConversation, ChatMessageMap } from "@/src/types/chat.types";
import { chatService } from "@/src/services/chat.services";
import { appendMessageSafe, isObjectRecord } from "@/src/context/chat/chatStateUtils";

export type SocketLike = {
  connected: boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
};

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, unknown>) => SocketLike;
  }
}

type Params = {
  canUseChat: boolean;
  isChatOpen: boolean;
  socketRef: MutableRefObject<SocketLike | null>;
  activeConversationRef: MutableRefObject<string>;
  setMessagesByConversation: Dispatch<SetStateAction<ChatMessageMap>>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
};

export function useChatSocket({
  canUseChat,
  isChatOpen,
  socketRef,
  activeConversationRef,
  setMessagesByConversation,
  setConversations,
}: Params) {
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

        setConversations((prev) => {
          const exists = prev.some(
            (conversation) => conversation.id === incoming.conversationId,
          );
          if (!exists) {
            const isOpenConversation =
              isChatOpen && activeConversationRef.current === incoming.conversationId;
            // Si llega mensaje de conversación nueva, la agregamos para no perder unread.
            return [
              {
                id: incoming.conversationId,
                sellerName: incoming.senderName || "Usuario",
                sellerId: incoming.senderId,
                seller: { name: incoming.senderName || "Usuario" },
                customer: "Tú",
                product: "",
                lastMessage: incoming.content,
                timestamp: new Date(incoming.createdAt).toISOString(),
                unreadCount: isOpenConversation ? 0 : 1,
              },
              ...prev,
            ];
          }

          return prev.map((conversation) => {
            if (conversation.id !== incoming.conversationId) return conversation;
            const isOpenConversation =
              isChatOpen && activeConversationRef.current === incoming.conversationId;
            return {
              ...conversation,
              lastMessage: incoming.content,
              timestamp: new Date(incoming.createdAt).toISOString(),
              unreadCount: isOpenConversation ? 0 : conversation.unreadCount + 1,
            };
          });
        });
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
  }, [
    activeConversationRef,
    canUseChat,
    isChatOpen,
    setConversations,
    setMessagesByConversation,
    socketRef,
  ]);
}
