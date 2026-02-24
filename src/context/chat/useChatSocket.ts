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

type NewChatMessageEventDetail = {
  conversationId: string;
  senderId?: string;
  createdAt: number;
};

const CHAT_NEW_MESSAGE_EVENT = "retrogarage:chat-new-message";
const CHAT_ALERT_DEBUG =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHAT_ALERT_DEBUG === "true";

function logChatSocket(scope: string, payload?: unknown) {
  if (!CHAT_ALERT_DEBUG) return;
  if (typeof payload === "undefined") {
    console.log(`[ChatAlert][useChatSocket] ${scope}`);
    return;
  }
  console.log(`[ChatAlert][useChatSocket] ${scope}`, payload);
}

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
  conversationsRef: MutableRefObject<ChatConversation[]>;
  setMessagesByConversation: Dispatch<SetStateAction<ChatMessageMap>>;
  setConversations: Dispatch<SetStateAction<ChatConversation[]>>;
};

export function useChatSocket({
  canUseChat,
  isChatOpen,
  socketRef,
  activeConversationRef,
  conversationsRef,
  setMessagesByConversation,
  setConversations,
}: Params): void {
  useEffect(() => {
    if (!canUseChat) return;
    const socketDisabled = process.env.NEXT_PUBLIC_ENABLE_CHAT_SOCKET === "false";
    if (socketDisabled) {
      logChatSocket("socket:disabledByEnv");
      return;
    }

    let canceled = false;
    const scriptId = "socket-io-client-cdn";

    const mountSocketWithFactory = (
      ioFactory: ((url: string, options?: Record<string, unknown>) => SocketLike) | undefined,
    ) => {
      if (canceled || !ioFactory || socketRef.current) return;
      const token = chatService.getSocketToken();
      if (!token) {
        logChatSocket("mount:skip:noToken");
        return;
      }

      const socket = ioFactory(chatService.getSocketUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        logChatSocket("socket:connect");
        const conversationIds = Array.from(
          new Set(
            (conversationsRef.current || [])
              .map((conversation) => conversation.id)
              .filter(Boolean),
          ),
        );
        if (conversationIds.length > 0) {
          conversationIds.forEach((id) => socket.emit("joinConversation", id));
          logChatSocket("socket:joinRooms", { conversationIds });
          return;
        }
        const activeId = activeConversationRef.current;
        if (activeId) {
          socket.emit("joinConversation", activeId);
          logChatSocket("socket:joinActive", { activeId });
        }
      });

      socket.on("connect_error", (error: unknown) => {
        logChatSocket("socket:connect_error", error);
      });
      socket.on("disconnect", (reason: unknown) => {
        logChatSocket("socket:disconnect", { reason });
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
        if (liveUserId && incoming.senderId === liveUserId) {
          logChatSocket("socket:newMessage:ignoredOwn", {
            conversationId: incoming.conversationId,
            senderId: incoming.senderId,
            liveUserId,
          });
          return;
        }
        logChatSocket("socket:newMessage:accepted", {
          conversationId: incoming.conversationId,
          senderId: incoming.senderId,
          messageId: incoming.id,
        });

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

        if (typeof window !== "undefined") {
          logChatSocket("event:dispatchNavbar", {
            conversationId: incoming.conversationId,
            senderId: incoming.senderId,
          });
          window.dispatchEvent(
            new CustomEvent<NewChatMessageEventDetail>(CHAT_NEW_MESSAGE_EVENT, {
              detail: {
                conversationId: incoming.conversationId,
                senderId: incoming.senderId,
                createdAt: incoming.createdAt,
              },
            }),
          );
        }
      });

      socketRef.current = socket;
      logChatSocket("socket:mounted");
    };

    const connect = async () => {
      // Prioridad: cliente socket empaquetado localmente (evita bloqueos por extensiones).
      try {
        const dynamicImport = new Function(
          "specifier",
          "return import(specifier)",
        ) as (specifier: string) => Promise<unknown>;
        const socketClientModule = (await dynamicImport(
          "socket.io-client",
        )) as { io?: (url: string, options?: Record<string, unknown>) => SocketLike };
        const ioFactory = socketClientModule?.io as
          | ((url: string, options?: Record<string, unknown>) => SocketLike)
          | undefined;
        mountSocketWithFactory(ioFactory);
        if (socketRef.current) return;
      } catch {
        // Si no está instalado, caemos al fallback por CDN.
        logChatSocket("socket:dynamicImportFailed:fallbackCDN");
      }

      if (window.io) {
        mountSocketWithFactory(window.io);
        return;
      }

      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
        script.async = true;
        script.onload = () => mountSocketWithFactory(window.io);
        script.onerror = () => {
          logChatSocket("socket:cdnBlocked");
        };
        document.body.appendChild(script);
      } else {
        const existingScript = document.getElementById(scriptId);
        const onLoad = () => mountSocketWithFactory(window.io);
        existingScript?.addEventListener("load", onLoad);
      }
    };

    void connect();

    return () => {
      canceled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      logChatSocket("socket:cleanup");
    };
  }, [
    activeConversationRef,
    canUseChat,
    conversationsRef,
    isChatOpen,
    setConversations,
    setMessagesByConversation,
    socketRef,
  ]);
}
