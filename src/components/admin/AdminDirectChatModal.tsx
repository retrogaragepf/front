"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { chatService } from "@/src/services/chat.services";
import { ChatMessage } from "@/src/types/chat.types";
import ChatMessages from "@/src/components/chat/chat-window/ChatMessages";
import ChatComposer from "@/src/components/chat/chat-window/ChatComposer";

type Props = {
  isOpen: boolean;
  conversationId: string | null;
  userName: string;
  onClose: () => void;
};

export default function AdminDirectChatModal({
  isOpen,
  conversationId,
  userName,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = useMemo(() => chatService.getCurrentUserId(), []);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "No se pudieron cargar los mensajes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    void loadMessages();
  }, [conversationId, isOpen, loadMessages]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, 4500);
    return () => window.clearInterval(intervalId);
  }, [conversationId, isOpen, loadMessages]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;
    try {
      setError(null);
      const sent = await chatService.sendMessage({ conversationId, content });
      setMessages((prev) => [...prev, sent]);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.";
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
      className="fixed inset-0 z-[96] flex items-end justify-center bg-zinc-900/60 p-2 sm:items-center sm:p-4"
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
