"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { chatService } from "@/src/services/chat.services";
import { ChatMessage } from "@/src/types/chat.types";
import ChatMessages from "@/src/components/chat/chat-window/ChatMessages";
import ChatComposer from "@/src/components/chat/chat-window/ChatComposer";
import { appendMessageSafe, isObjectRecord } from "@/src/context/chat/chatStateUtils";

type Props = {
  isOpen: boolean;
  conversationId: string | null;
  userName: string;
  onClose: () => void;
};

type SocketLike = {
  connected: boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
};

export default function AdminDirectChatModal({
  isOpen,
  conversationId,
  userName,
  onClose,
}: Props): ReactElement | null {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = useMemo(() => chatService.getCurrentUserId(), []);
  const POLL_INTERVAL_MS = 2_000;
  const [socket, setSocket] = useState<SocketLike | null>(null);

  const areMessagesEqualById = (prev: ChatMessage[], next: ChatMessage[]) => {
    if (prev === next) return true;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i += 1) {
      if (prev[i].id !== next[i].id) return false;
    }
    return true;
  };

  const loadMessages = useCallback(async (options?: { silent?: boolean }) => {
    if (!conversationId) return;
    const silent = Boolean(options?.silent);
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await chatService.getMessages(conversationId);
      setMessages((prev) => (areMessagesEqualById(prev, data) ? prev : data));
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "No se pudieron cargar los mensajes.";
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    void loadMessages({ silent: false });
  }, [conversationId, isOpen, loadMessages]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    if (process.env.NEXT_PUBLIC_ENABLE_CHAT_SOCKET === "false") return;

    let canceled = false;
    let mountedSocket: SocketLike | null = null;

    const mountSocket = (
      ioFactory: ((url: string, options?: Record<string, unknown>) => SocketLike) | undefined,
    ) => {
      if (canceled || !ioFactory) return;
      const token = chatService.getSocketToken();
      if (!token) return;

      mountedSocket = ioFactory(chatService.getSocketUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
      });

      mountedSocket.on("connect", () => {
        console.log("[AdminDirectChatModal] socket:connect", { conversationId });
        mountedSocket?.emit("joinConversation", conversationId);
      });

      mountedSocket.on("newMessage", (...args: unknown[]) => {
        const payload = args[0];
        if (!isObjectRecord(payload)) return;
        const incoming = chatService.normalizeSocketMessage(payload, conversationId);
        if (!incoming) return;
        console.log("[AdminDirectChatModal] socket:newMessage", {
          conversationId: incoming.conversationId,
          messageId: incoming.id,
          senderId: incoming.senderId,
        });
        setMessages((prev) => appendMessageSafe(prev, incoming));
      });

      setSocket(mountedSocket);
    };

    const connect = async () => {
      try {
        const dynamicImport = new Function(
          "specifier",
          "return import(specifier)",
        ) as (specifier: string) => Promise<unknown>;
        const socketClientModule = (await dynamicImport(
          "socket.io-client",
        )) as { io?: (url: string, options?: Record<string, unknown>) => SocketLike };
        mountSocket(socketClientModule?.io);
      } catch {
        console.warn("[AdminDirectChatModal] socket:unavailable, fallback polling");
        // Si no hay socket client, seguimos con polling/REST.
      }
    };

    void connect();

    return () => {
      canceled = true;
      mountedSocket?.disconnect();
      setSocket(null);
    };
  }, [conversationId, isOpen]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const intervalId = window.setInterval(() => {
      void loadMessages({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [conversationId, isOpen, loadMessages, POLL_INTERVAL_MS]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;
    try {
      setError(null);
      console.log("[AdminDirectChatModal] send:rest", {
        conversationId,
        socketConnected: Boolean(socket?.connected),
      });
      const sent = await chatService.sendMessage({ conversationId, content });
      setMessages((prev) => appendMessageSafe(prev, sent));
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.";
      console.error("[AdminDirectChatModal] send:error", { conversationId, error: e });
      setError(message);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-96 flex items-end justify-center bg-zinc-900/60 p-2 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex h-[min(86vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-amber-900 bg-amber-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <header className="flex items-center justify-between border-b-2 border-amber-900 bg-amber-50 px-4 py-3">
          <div>
            <h2 className="font-handwritten text-2xl text-amber-900">
              Chat con {userName || "Usuario"}
            </h2>
            <p className="text-xs uppercase tracking-widest text-emerald-900/80">
              Gestión exclusiva administrador
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-amber-900 px-3 py-1 text-xs font-display uppercase tracking-[0.2em] text-amber-900 transition hover:bg-amber-200"
          >
            Cerrar
          </button>
        </header>

        {loading && (
          <div className="px-4 py-2 text-sm font-bold text-zinc-700">
            Cargando mensajes...
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 rounded-xl border-2 border-red-700 bg-red-100 p-3 text-sm font-bold text-red-800">
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-amber-300 bg-amber-50/80 m-3">
          <ChatMessages
            messages={messages}
            currentParticipant="seller"
            currentUserId={currentUserId}
          />
          <ChatComposer onSendMessage={handleSendMessage} />
        </div>
      </section>
    </div>
  );
}
