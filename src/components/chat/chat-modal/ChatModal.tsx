"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/src/context/ChatContext";
import ChatHistoryList from "@/src/components/chat/chat-history/ChatHistoryList";
import ChatMessages from "@/src/components/chat/chat-window/ChatMessages";
import ChatComposer from "@/src/components/chat/chat-window/ChatComposer";

const ChatModal = () => {
  const {
    isChatOpen,
    activeConversation,
    activeMessages,
    conversations,
    currentParticipant,
    currentUserId,
    closeChat,
    selectConversation,
    sendMessage,
  } = useChat();
  const panelRef = useRef<HTMLElement | null>(null);

  const formatShortDateTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "Ahora";
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  useEffect(() => {
    if (!isChatOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeChat, isChatOpen]);

  if (!isChatOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-zinc-900/55 p-2 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeChat();
      }}
    >
      <section
        ref={panelRef}
        className="flex h-[min(86vh,780px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border-2 border-amber-900 bg-amber-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]"
      >
        <header className="flex items-center justify-between border-b-2 border-amber-900 bg-amber-50 px-4 py-3">
          <div>
            <h2 className="font-handwritten text-2xl text-amber-900">
              Chat comprador-vendedor
            </h2>
            <p className="text-xs uppercase tracking-widest text-emerald-900/80">
              {activeConversation
                ? `${activeConversation.sellerName || "Usuario"} · ${formatShortDateTime(activeConversation.timestamp)}`
                : "Selecciona una conversación"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="rounded-lg border border-amber-900 px-3 py-1 text-xs font-display uppercase tracking-[0.2em] text-amber-900 transition hover:bg-amber-200"
          >
            Cerrar
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 p-2 sm:p-3 lg:grid-cols-[320px_1fr]">
          <div className="min-h-0">
            <ChatHistoryList
              conversations={conversations}
              activeConversationId={activeConversation?.id}
              onSelectConversation={selectConversation}
            />
          </div>

          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-amber-300 bg-amber-50/80">
            <div className="border-b border-amber-300 bg-amber-100/70 px-4 py-3">
              {activeConversation ? (
                <>
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-emerald-900/80">
                    Vendedor: {activeConversation.sellerName || "Usuario"}
                  </p>
                  <p className="text-sm text-zinc-800">
                    Producto:{" "}
                    <span className="font-semibold">
                      {activeConversation.product || "Sin referencia"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-700">
                    Último mensaje: {formatShortDateTime(activeConversation.timestamp)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-700">No hay conversaciones aún.</p>
              )}
            </div>

            <ChatMessages
              messages={activeMessages}
              currentParticipant={currentParticipant}
              currentUserId={currentUserId}
            />
            <ChatComposer onSendMessage={sendMessage} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChatModal;
